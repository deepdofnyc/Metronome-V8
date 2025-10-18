

import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { ChevronLeftIcon } from './Icons';

interface FeedbackPageProps {
    onClose: () => void;
}

const FeedbackPage: React.FC<FeedbackPageProps> = ({ onClose }) => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        feedback: '',
    });
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [error, setError] = useState('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.feedback.trim()) {
            setError('Feedback message cannot be empty.');
            setStatus('error');
            return;
        }
        
        setStatus('submitting');
        setError('');

        try {
            // This is a mock submission. In a real app, you'd send this to your backend.
            // For this demo, we use Gemini to process and format the feedback.
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const prompt = `
A user has submitted the following feedback for the Pulse Q app. 
Please format it into a clean, readable report and add a category suggestion 
(e.g., Bug Report, Feature Request, General Feedback, Praise).

User Details:
- Name: ${formData.firstName} ${formData.lastName}
- Email: ${formData.email}

Feedback:
"${formData.feedback}"

Formatted Report:
`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            console.log("--- Gemini Processed Feedback ---");
            console.log(response.text);
            // In a real app, this formatted text could be sent to a support desk, Slack, etc.

            setStatus('success');
            setTimeout(() => {
                onClose();
                setStatus('idle');
                setFormData({ firstName: '', lastName: '', email: '', feedback: '' });
            }, 2500);

        } catch (err) {
            console.error("Error submitting feedback:", err);
            setError('Could not submit feedback. Please try again later.');
            setStatus('error');
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div 
                className="w-full max-w-[380px] max-h-full overflow-y-auto animate-panel rounded-3xl bg-[var(--bg-color)]" 
                onClick={e => e.stopPropagation()}
            >
                <div className="flex flex-col gap-4 px-[15px] py-4">
                    <header className="w-full h-10 flex items-center justify-between">
                        <button onClick={onClose} className="p-2 -m-2 rounded-full hover:bg-white/10 transition-colors" aria-label="Back to metronome">
                            <ChevronLeftIcon />
                        </button>
                        <h2 className="text-xl font-bold">Submit Feedback</h2>
                        <div className="w-6" /> {/* Spacer for centering title */}
                    </header>

                    <div className="w-full bg-[var(--container-bg)] backdrop-blur-lg border border-[var(--container-border)] rounded-3xl p-4 flex flex-col">
                        {status === 'success' ? (
                            <div className="text-center py-12">
                                <h3 className="text-2xl font-bold text-[var(--primary-accent)] mb-2">Thank You!</h3>
                                <p className="text-white/80">Your feedback has been received.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label htmlFor="firstName" className="block text-sm font-medium text-white/70 mb-1">First Name</label>
                                        <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleInputChange} className="w-full p-2 bg-black/25 border border-white/20 rounded-lg focus:ring-2 focus:ring-[var(--primary-accent)] focus:border-[var(--primary-accent)] outline-none" />
                                    </div>
                                    <div className="flex-1">
                                        <label htmlFor="lastName" className="block text-sm font-medium text-white/70 mb-1">Last Name</label>
                                        <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} className="w-full p-2 bg-black/25 border border-white/20 rounded-lg focus:ring-2 focus:ring-[var(--primary-accent)] focus:border-[var(--primary-accent)] outline-none" />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-white/70 mb-1">Email</label>
                                    <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full p-2 bg-black/25 border border-white/20 rounded-lg focus:ring-2 focus:ring-[var(--primary-accent)] focus:border-[var(--primary-accent)] outline-none" />
                                </div>
                                <div>
                                    <label htmlFor="feedback" className="block text-sm font-medium text-white/70 mb-1">Feedback</label>
                                    <textarea id="feedback" name="feedback" rows={5} value={formData.feedback} onChange={handleInputChange} required className="w-full p-2 bg-black/25 border border-white/20 rounded-lg focus:ring-2 focus:ring-[var(--primary-accent)] focus:border-[var(--primary-accent)] outline-none resize-none" />
                                </div>
                                
                                {status === 'error' && <p className="text-red-400 text-sm">{error}</p>}

                                <button 
                                    type="submit" 
                                    disabled={status === 'submitting'}
                                    className="w-full py-3 bg-[var(--primary-accent)] text-black font-bold rounded-xl hover:bg-[var(--primary-accent-dark)] transition-colors disabled:opacity-50 disabled:cursor-wait"
                                >
                                    {status === 'submitting' ? 'Sending...' : 'Submit Feedback'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeedbackPage;