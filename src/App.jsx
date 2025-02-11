import Login from './pages/Login';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/orders" element={<Orders />} />
      </Routes>
    </Router>
  );
}

export default App; 