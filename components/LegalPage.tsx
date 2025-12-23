import React from 'react';
import { motion } from 'framer-motion';

interface Props {
    type: 'terms' | 'privacy';
    onBack: () => void;
}

const LegalPage: React.FC<Props> = ({ type, onBack }) => {
    const content = {
        terms: {
            title: 'Terms of Service',
            lastUpdated: 'December 23, 2023',
            sections: [
                {
                    heading: '1. Acceptance of Terms',
                    text: 'By accessing or using NameLime, you agree to be bound by these Terms of Service. If you do not agree, please do not use our services.'
                },
                {
                    heading: '2. Description of Service',
                    text: 'NameLime provides AI-powered startup naming suggestions and domain availability checks. We reserve the right to modify or discontinue the service at any time.'
                },
                {
                    heading: '3. User Responsibilities',
                    text: 'You are responsible for maintaining the confidentiality of your account and password. You agree to notify us immediately of any unauthorized use of your account.'
                },
                {
                    heading: '4. Intellectual Property',
                    text: 'The AI-generated names are provided for your use. However, we do not guarantee the trademark availability of any generated names.'
                },
                {
                    heading: '5. Limitation of Liability',
                    text: 'NameLime shall not be liable for any indirect, incidental, or consequential damages resulting from the use or inability to use our services.'
                }
            ]
        },
        privacy: {
            title: 'Privacy Policy',
            lastUpdated: 'December 23, 2023',
            sections: [
                {
                    heading: '1. Information We Collect',
                    text: 'We collect information you provide directly to us, such as when you create an account, including your email address and name.'
                },
                {
                    heading: '2. How We Use Information',
                    text: 'We use the information to provide, maintain, and improve our services, and to communicate with you about updates and promotions.'
                },
                {
                    heading: '3. Data Security',
                    text: 'We implement reasonable security measures to protect your personal information from unauthorized access or disclosure.'
                },
                {
                    heading: '4. Third-Party Services',
                    text: 'We use Firebase for authentication and database services. Your data is handled in accordance with their privacy policies.'
                },
                {
                    heading: '5. Changes to This Policy',
                    text: 'We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page.'
                }
            ]
        }
    };

    const activeContent = content[type];

    return (
        <div className="relative min-h-screen w-full bg-background text-text-main flex flex-col transition-colors duration-500 overflow-hidden">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border flex items-center px-6 h-16">
                <button
                    onClick={onBack}
                    className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-text-muted hover:text-text-main transition-colors mr-4"
                >
                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                </button>
                <h1 className="text-lg font-bold tracking-tight">{activeContent.title}</h1>
            </header>

            {/* Content */}
            <main className="flex-1 overflow-y-auto pt-24 pb-20 px-6 max-w-2xl mx-auto w-full no-scrollbar">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <p className="text-xs font-bold text-[#FF8B66] uppercase tracking-widest mb-2">
                        Last Updated: {activeContent.lastUpdated}
                    </p>
                    <div className="space-y-8 mt-8">
                        {activeContent.sections.map((section, index) => (
                            <div key={index} className="space-y-3">
                                <h2 className="text-xl font-bold tracking-tight text-text-main">
                                    {section.heading}
                                </h2>
                                <p className="text-[15px] leading-relaxed text-text-muted">
                                    {section.text}
                                </p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </main>
        </div>
    );
};

export default LegalPage;
