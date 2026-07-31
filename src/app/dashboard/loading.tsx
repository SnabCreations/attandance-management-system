export default function DashboardLoading() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      width: '100%',
      minHeight: '400px',
      color: '#ffffff'
    }}>
      <div className="bouncing-loader">
        <div></div>
        <div></div>
        <div></div>
      </div>
      <h3 style={{ marginTop: '2rem', fontWeight: 600, fontSize: '1.25rem', letterSpacing: '1px' }}>Loading...</h3>
      
      <style>{`
        .bouncing-loader {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.5rem;
        }

        .bouncing-loader > div {
          width: 1rem;
          height: 1rem;
          background-color: #3b82f6;
          border-radius: 50%;
          animation: bouncing-loader 0.6s infinite alternate;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
        }

        .bouncing-loader > div:nth-child(2) {
          animation-delay: 0.2s;
          background-color: #60a5fa;
        }

        .bouncing-loader > div:nth-child(3) {
          animation-delay: 0.4s;
          background-color: #93c5fd;
        }

        @keyframes bouncing-loader {
          to {
            opacity: 0.3;
            transform: translateY(-1rem);
          }
        }
      `}</style>
    </div>
  )
}
