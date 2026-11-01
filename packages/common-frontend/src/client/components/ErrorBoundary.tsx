import { Alert, Button } from "@mui/material";
import React from "react";
import { Translation } from "react-i18next";

// Since React 19 an error thrown while rendering unmounts the whole root, so
// without a boundary any crash leaves a blank page. React has no hook for this.
export class ErrorBoundary extends React.Component<
  // A change in any of `resetKeys` clears the error, e.g. a logout, which
  // replaces the crashed screen without reloading the page.
  { children: React.ReactNode, resetKeys?: unknown[] },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidUpdate(prevProps: { resetKeys?: unknown[] }) {
    const prev = prevProps.resetKeys ?? [];
    const next = this.props.resetKeys ?? [];
    if (this.state.hasError && (
      prev.length !== next.length || prev.some((key, i) => !Object.is(key, next[i]))
    )) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <Translation>
        {t => (
          <Alert
            severity="error"
            action={
              // A reload, not a reset: the screen that crashed is chosen by the
              // team's state, so rendering it again would crash again.
              <Button color="inherit" onClick={() => window.location.reload()}>
                {t('general.backHome')}
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
