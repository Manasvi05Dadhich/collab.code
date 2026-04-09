import './App.css';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from './pages/Home';
import CodeEditor from './pages/codeEditor';

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/editor/:roomId' element={<CodeEditor />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
