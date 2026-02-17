import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log error to console with special formatting to stand out
        console.error('🔴 GLOBAL ERROR BOUNDARY CAUGHT CRASH:', error);
        console.error('Component Stack:', errorInfo.componentStack);
        this.setState({ errorInfo });
    }

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="fixed inset-0 z-[9999] bg-[#0f172a] text-white flex flex-col items-center justify-center p-6 text-center font-sans">
                    <div className="bg-red-500/10 p-4 rounded-full mb-6">
                        <AlertTriangle className="w-12 h-12 text-red-500" />
                    </div>

                    <h1 className="text-3xl font-bold mb-2 text-white">Application Crashed</h1>
                    <p className="text-gray-400 mb-8 max-w-md">
                        A critical error stopped the app from loading.
                    </p>

                    <button
                        onClick={this.handleReload}
                        className="flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-600 rounded-lg font-semibold transition-colors mb-8"
                    >
                        <RefreshCw className="w-5 h-5" />
                        Reload Application
                    </button>

                    {this.state.error && (
                        <div className="w-full max-w-3xl text-left bg-black/50 rounded-lg border border-red-900/50 overflow-hidden">
                            <div className="px-4 py-2 bg-red-900/20 border-b border-red-900/30 flex justify-between items-center">
                                <span className="text-xs font-mono text-red-300 uppercase tracking-wider">Error Details</span>
                            </div>
                            <div className="p-4 overflow-auto max-h-[400px]">
                                <p className="font-mono text-red-400 font-bold mb-4">
                                    {this.state.error.toString()}
                                </p>
                                {this.state.errorInfo && (
                                    <pre className="font-mono text-xs text-gray-500 whitespace-pre-wrap">
                                        {this.state.errorInfo.componentStack}
                                    </pre>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}
