import './App.css';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from './pages/Home';
import CodeEditor from './pages/codeEditor';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1c1c1e',
            color: '#f5f5f7',
            border: '0.5px solid rgba(255,255,255,0.12)',
            borderRadius: '12px',
            fontFamily: "'Inter', sans-serif",
            fontSize: '13px',
            fontWeight: '500',
            padding: '10px 16px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          },
          success: { iconTheme: { primary: '#30d158', secondary: '#1c1c1e' } },
          error:   { iconTheme: { primary: '#ff453a', secondary: '#1c1c1e' } },
        }}
      />
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