import React, { useState, useEffect, useRef } from 'react';
import { User, GenerationRequest, GeneratedName } from '../types';
import { db } from '../services/firebase';
import { collection, query, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

interface HistoryItem {
  id: string;
  request: GenerationRequest;
  results: GeneratedName[];
  timestamp: any;
}

interface Props {
  user: User;
  onSelect: (results: GeneratedName[], request: GenerationRequest) => void;
}

const History: React.FC<Props> = ({ user, onSelect }) => {
  if (!user) return null;
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [swipedId, setSwipedId] = useState<string | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null);
  const itemToRestore = useRef<HistoryItem | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const q = query(
          collection(db, 'users', user.id, 'history'),
          orderBy('timestamp', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const items = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as HistoryItem[];
        setHistoryItems(items);
      } catch (e) {
        console.error("Error fetching history:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user.id]);

  const handleDelete = async (e: React.MouseEvent, item: HistoryItem) => {
    e.stopPropagation();
    itemToRestore.current = item;
    setSwipedId(null);
    setShowUndo(true);
    setHistoryItems(prev => prev.filter(i => i.id !== item.id));

    try {
      await deleteDoc(doc(db, 'users', user.id, 'history', item.id));
    } catch (err) {
      console.error("Error deleting from firestore:", err);
    }

    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => {
      setShowUndo(false);
      itemToRestore.current = null;
    }, 5000);
  };

  const handleUndo = async () => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }

    if (itemToRestore.current) {
      const restored = itemToRestore.current;
      setHistoryItems(prev => {
        const newItems = [...prev, restored];
        return newItems.sort((a, b) => {
          const timeA = a.timestamp?.seconds || 0;
          const timeB = b.timestamp?.seconds || 0;
          return timeB - timeA;
        });
      });

      try {
        const { setDoc, doc } = await import('firebase/firestore');
        await setDoc(doc(db, 'users', user.id, 'history', restored.id), {
          request: restored.request,
          results: restored.results,
          timestamp: restored.timestamp
        });
      } catch (err) {
        console.error("Error restoring to Firestore:", err);
      }
    }
    setShowUndo(false);
  };

  return (
    <div className="min-h-full bg-background transition-colors duration-500">
      <div className="flex flex-col w-full max-w-2xl mx-auto">
        {/* Header */}
        <div className="px-5 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-5">
          <h1 className="text-4xl font-black text-text-main tracking-tight mb-2 dark:text-gradient-premium">History</h1>
          <p className="text-[13px] font-bold text-text-muted uppercase tracking-widest">
            Past Generations
          </p>
        </div>

        <div className="px-5 pb-32 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 opacity-50">
              <div className="w-12 h-12 border-4 border-[#FF8B66]/20 border-t-[#FF8B66] rounded-full animate-spin" />
            </div>
          ) : historyItems.length === 0 ? (
            <div className="bg-surface rounded-[2.5rem] p-12 text-center border border-border shadow-sm">
              <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-6 text-text-muted/20">
                <span className="material-symbols-outlined text-3xl">history</span>
              </div>
              <h3 className="text-lg font-bold text-text-main mb-2">No history yet</h3>
              <p className="text-text-muted text-sm">Your naming adventures will appear here.</p>
            </div>
          ) : (
            <AnimatePresence mode='popLayout'>
              {historyItems.map((item, index) => (
                <motion.div
                  layout
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative group"
                >
                  {/* Swipe Actions Background - Now Clickable */}
                  <button
                    onClick={(e) => handleDelete(e, item)}
                    className="absolute inset-0 bg-[#FF8B66] rounded-[2rem] flex items-center justify-end pr-8 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-white text-2xl">delete</span>
                  </button>

                  <motion.div
                    drag="x"
                    dragConstraints={{ left: -100, right: 0 }}
                    onDragEnd={(_, info) => {
                      if (info.offset.x < -50) setSwipedId(item.id);
                      else setSwipedId(null);
                    }}
                    animate={{ x: swipedId === item.id ? -100 : 0 }}
                    className="relative bg-surface p-6 rounded-[2rem] border border-border shadow-sm active:scale-[0.98] transition-all z-10"
                    onClick={() => swipedId ? setSwipedId(null) : onSelect(item.results, item.request)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-[10px] font-bold text-[#FF8B66] uppercase tracking-wider mb-1 block">
                          {item.request.style} • {item.request.tone}
                        </span>
                        <h3 className="text-lg font-black text-text-main leading-tight line-clamp-2">
                          {item.request.description}
                        </h3>
                      </div>
                      <span className="text-[10px] font-bold text-text-muted bg-background px-3 py-1.5 rounded-full border border-border">
                        {item.results.length}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {item.results.slice(0, 3).map((res, i) => (
                        <span key={i} className="px-3 py-1.5 bg-background rounded-xl text-[11px] font-bold text-text-muted border border-border">
                          {res.name}
                        </span>
                      ))}
                      {item.results.length > 3 && (
                        <span className="px-3 py-1.5 bg-background rounded-xl text-[11px] font-bold text-text-muted/40 border border-border">
                          +{item.results.length - 3}
                        </span>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showUndo && (
          <motion.div
            initial={{ opacity: 0, x: -50, y: 0 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="fixed bottom-24 left-4 z-[60]"
          >
            <div className="bg-[#121212] dark:bg-white text-white dark:text-black px-5 py-3 rounded-2xl shadow-xl flex items-center gap-4">
              <span className="text-sm font-bold">Deleted</span>
              <button
                onClick={handleUndo}
                className="text-[#FF8B66] font-black text-sm uppercase tracking-wide"
              >
                Undo
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default History;
