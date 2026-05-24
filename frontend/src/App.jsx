// App.jsx — Root component that renders the single-page HomePage.

import ErrorBoundary from "./components/ErrorBoundary.jsx";
import HomePage from "./components/HomePage.jsx";

function App() {
  return (
    <ErrorBoundary>
      <HomePage />
    </ErrorBoundary>
  );
}

export default App;
