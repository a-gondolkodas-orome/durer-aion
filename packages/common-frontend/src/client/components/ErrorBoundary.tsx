import { Alert, Button } from "@mui/material";
import React from "react";
import { Translation } from "react-i18next";

// Since React 19 an error thrown while rendering unmounts the whole root, so
// without a boundary any crash leaves a blank page. React has no hook for this.
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode, onReset?: () => void },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // A caught error never reaches `window.onerror`, which is where Sentry
    // listens; this re-dispatches it there without throwing.
    window.reportError(error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <Translation>
        {t => (
          <Alert
            severity="error"
            action={
              <Button color="inherit" onClick={() => {
                this.props.onReset?.();
                this.setState({ hasError: false });
              }}>
                {t('error.backHome')}
              </Button>
            }
          >
            {t('error.unexpected')}
          </Alert>
        )}
      </Translation>
    );
  }
}
