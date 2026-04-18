import './App.css';
import { BrowserRouter, Routes, Route } from "react-router";
import Home from './pages/home';
import codeEditor from './pages/codeEditor';

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Home/>} />
          <Route path='/editor/:roomId' element={<codeEditor/>} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
