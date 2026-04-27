import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { App } from './App';
import { AppProviders } from './app/providers/AppProviders';
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/ibm-plex-sans/700.css';
import './styles/globals.css';

function isInvalidViewTransitionState(cause: unknown): cause is DOMException {
  const domCause = cause as DOMException;
  if (!(domCause instanceof DOMException)) {
    return false;
  }

  const message = domCause.message.toLowerCase();
  return (
    (domCause.name === 'InvalidStateError' && message.includes('transition was aborted'))
    || (domCause.name === 'AbortError' && message.includes('transition was skipped'))
  );
}

function guardBrowserViewTransitions() {
  const doc = document as Document & {
    startViewTransition?: (updateCallback: () => void | Promise<void>) => ViewTransition;
  };

  if (typeof doc.startViewTransition !== 'function') {
    return;
  }

  const originalStartViewTransition = doc.startViewTransition.bind(doc);

  doc.startViewTransition = (updateCallback) => {
    const transition = originalStartViewTransition(updateCallback);

    void transition.finished.catch((cause) => {
      if (!isInvalidViewTransitionState(cause)) {
        console.error(cause);
      }
    });

    return transition;
  };
}

guardBrowserViewTransitions();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProviders>
        <App />
      </AppProviders>
    </BrowserRouter>
  </React.StrictMode>,
);
