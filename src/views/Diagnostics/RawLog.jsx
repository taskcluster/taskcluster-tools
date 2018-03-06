const RawLog = props => (
  <div>
    <h3>Log: </h3>
    <div style={{ backgroundColor: '#1f1f1f', padding: 10, margin: 10 }}>
      {props.text.split('\n').map((line, key) => (
        <p
          key={`raw-log-${key}`}
          style={{ color: line.includes('✓') ? 'green' : 'white' }}>
          {line}
        </p>
      ))}
    </div>
  </div>
);

export default RawLog;
