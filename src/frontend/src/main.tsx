import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { App } from './App';
import { AppProviders } from './app/providers/AppProviders';
import './styles/globals.css';

function isInvalidViewTransitionState(cause: unknown): cause is DOMException {
  return (
    cause instanceof DOMException &&
    cause.name === 'InvalidStateError' &&
    cause.message.toLowerCase().includes('transition was aborted')
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
