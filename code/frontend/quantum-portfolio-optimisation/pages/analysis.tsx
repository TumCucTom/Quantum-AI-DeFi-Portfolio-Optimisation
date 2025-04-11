import React from 'react';

const FullGraphs: React.FC = () => {
  return (
    <div style={styles.container}>
      <h2>Full Graphs Page</h2>
      <div style={styles.graphArea}>
        {/* Insert your graph components here */}
        <p>All your graphs go here</p>
      </div>
    </div>
  );
};

export default FullGraphs;

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    padding: '2rem',
  },
  graphArea: {
    border: '1px solid #ccc',
    marginTop: '1rem',
    padding: '1rem',
    minHeight: '400px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};
