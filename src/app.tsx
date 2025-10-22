import { Router, Route } from '@solidjs/router';
import About from './about';
import Calculator from './calculator';

export default function App() {
  return (
    <Router>
      <Route path="/" component={Calculator} />
      <Route path="/about" component={About} />
    </Router>
  );
}
