import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('[ErrorBoundary] Caught error:', error, info.componentStack);
    }

    private handleGoHome = () => {
        this.setState({ hasError: false, error: null });
        window.location.href = '/dashboard';
    };

    private handleClearAndReload = () => {
        try {
            localStorage.clear();
            sessionStorage.clear();
        } catch { /* storage clear may fail silently */ }
        window.location.href = '/dashboard';
    };

    private handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 p-8 text-center">
                    <div className="text-5xl">😵</div>
                    <h2 className="text-xl font-bold text-foreground">Something went wrong</h2>
                    <p className="text-sm text-muted-foreground max-w-md">
                        {this.state.error?.message || 'An unexpected error occurred. Your data is safe.'}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 mt-2">
                        <button
                            onClick={this.handleRetry}
                            className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
                        >
                            Try Again
                        </button>
                        <button
                            onClick={this.handleGoHome}
                            className="px-6 py-2.5 rounded-lg bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80 transition-colors"
                        >
                            Go to Dashboard
                        </button>
                        <button
                            onClick={this.handleClearAndReload}
                            className="px-6 py-2.5 rounded-lg border border-border text-muted-foreground font-medium text-sm hover:bg-accent transition-colors"
                        >
                            Clear Cache &amp; Reload
                        </button>
                    </div>
                    <p className="text-xs text-muted-foreground/60 mt-2">
                        If this keeps happening, try "Clear Cache &amp; Reload" to reset all local data.
                    </p>
                </div>
            );
        }

        return this.props.children;
    }
}
