import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Room from './pages/Room';
import Main from './pages/Main';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/room/:id" element={<Room />} />
        <Route path="/" element={<Main />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
