import { useState, useEffect } from 'react';
import { Container, Button, Spinner, Alert, Card, Badge, Row, Col, ListGroup, ProgressBar } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import API from '../API';

function GameLayout() {
  // --- MASTER GAME STATE ---
  const [phase, setPhase] = useState('SETUP'); // SETUP, PLANNING, EXECUTION, RESULT
  const [network, setNetwork] = useState(null);
  const [events, setEvents] = useState([]);
  const [coins, setCoins] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // --- MEMORIZATION TIMER STATE ---
  const [setupTimeLeft, setSetupTimeLeft] = useState(10);

  // --- PLANNING STATE ---
  const [startStation, setStartStation] = useState(null);
  const [destStation, setDestStation] = useState(null);
  const [timeLeft, setTimeLeft] = useState(90);
  const [availableSegments, setAvailableSegments] = useState([]);
  const [route, setRoute] = useState([]);

  // --- EXECUTION & RESULT STATE ---
  const [currentStep, setCurrentStep] = useState(0);
  const [executionLog, setExecutionLog] = useState([]);
  const [routeIsValid, setRouteIsValid] = useState(true);
  const [savingScore, setSavingScore] = useState(false);
  
  const navigate = useNavigate();

  // --- INITIAL DATA FETCH ---
  useEffect(() => {
    const fetchGameData = async () => {
      try {
        const netData = await API.getNetwork();
        const eventData = await API.getEvents();
        setNetwork(netData);
        setEvents(eventData);
        setLoading(false);
      } catch (err) {
        setError('Failed to load game data from server.');
        setLoading(false);
      }
    };
    fetchGameData();
  }, []);

  // --- 10-SECOND MEMORIZATION TIMER EFFECT ---
  useEffect(() => {
    if (phase === 'SETUP' && setupTimeLeft > 0) {
      const timer = setTimeout(() => setSetupTimeLeft(setupTimeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (phase === 'SETUP' && setupTimeLeft === 0) {
      startPlanning(); // Auto-start when memorization time runs out!
    }
  }, [phase, setupTimeLeft]);

  // --- 90-SECOND TIMER EFFECT ---
  useEffect(() => {
    if (phase === 'PLANNING' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (phase === 'PLANNING' && timeLeft === 0) {
      submitRoute(); // Auto-submit when time runs out
    }
  }, [phase, timeLeft]);

  // --- START GAME ---
  const startPlanning = () => {
    let segments = [];
    let segIdCounter = 1;
    network.lines.forEach(line => {
      const stops = network.connections.filter(c => c.line_id === line.id);
      for (let i = 0; i < stops.length - 1; i++) {
        const st1 = network.stations.find(s => s.id === stops[i].station_id);
        const st2 = network.stations.find(s => s.id === stops[i + 1].station_id);
        segments.push({
          id: segIdCounter++, line: line.name, s1: st1, s2: st2, name: `${st1.name} <-> ${st2.name}`
        });
      }
    });

    // STRICT HINT COMPLIANCE: Shuffle the segments
    segments.sort(() => Math.random() - 0.5); 

    setAvailableSegments(segments);
    
    // Assign Start and Destination
    setStartStation(network.stations.find(s => s.name === 'Centrale'));
    setDestStation(network.stations.find(s => s.name === 'Campo dellEco'));
    setPhase('PLANNING');
  };

  const addSegmentToRoute = (segment) => {
    if (!route.some(r => r.id === segment.id)) setRoute([...route, segment]);
  };

  const removeSegmentFromRoute = (index) => {
    const newRoute = [...route];
    newRoute.splice(index, 1);
    setRoute(newRoute);
  };

  // --- ROUTE VALIDATION ---
  const submitRoute = () => {
    let isValid = true;
    
    if (route.length === 0) {
      isValid = false;
    } else {
      // Trace the path to ensure it is continuous and reaches the destination
      let currNodeId = startStation.id;
      for (let i = 0; i < route.length; i++) {
        const seg = route[i];
        if (seg.s1.id === currNodeId) {
          currNodeId = seg.s2.id;
        } else if (seg.s2.id === currNodeId) {
          currNodeId = seg.s1.id;
        } else {
          isValid = false; // Broken chain
          break;
        }
      }
      if (currNodeId !== destStation.id) isValid = false;
    }

    setRouteIsValid(isValid);
    setPhase('EXECUTION');
    setCurrentStep(0);
    
    if (!isValid) {
      setExecutionLog(["INVALID ROUTE! The path is broken, doesn't reach the destination, or doesn't start at the origin."]);
      setCoins(0); // Penalty for invalid route
    } else {
      setExecutionLog(["Route validated successfully! Ready to depart."]);
    }
  };

  // --- EXECUTION STEP ---
  const executeNextStep = () => {
    if (!routeIsValid) return endGame(0);

    if (currentStep < route.length) {
      const seg = route[currentStep];
      let currentCoins = coins;
      let logMessage = `Step ${currentStep + 1}: Traveled along ${seg.name}.`;

      // STRICT HINT COMPLIANCE: Escalating bad luck after 4 stations
      if (events.length > 0) {
        let eventPool = events;
        
        // If they have traveled 4 stations, artificially increase the odds of bad events
        if (currentStep >= 4) {
          const badEvents = events.filter(e => parseInt(e.effect) < 0);
          // Add bad events to the pool 3 extra times to drastically raise their probability
          eventPool = [...events, ...badEvents, ...badEvents, ...badEvents];
        }

        const randomEvent = eventPool[Math.floor(Math.random() * eventPool.length)];
        const effectVal = parseInt(randomEvent.effect);
        currentCoins += effectVal;
        logMessage += ` EVENT: ${randomEvent.description} (${effectVal > 0 ? '+' : ''}${effectVal} coins).`;
      }

      setCoins(currentCoins);
      setExecutionLog([...executionLog, logMessage]);
      setCurrentStep(currentStep + 1);
    } else {
      endGame(coins > 0 ? coins : 0);
    }
  };

  // --- RESULT & SAVE ---
  const endGame = async (finalScore) => {
    setCoins(finalScore); // Forces the UI to show 0 if coins went negative
    setPhase('RESULT');
    setSavingScore(true);
    try {
      await API.saveGame(finalScore);
    } catch (err) {
      setError('Score failed to save to the database.');
    } finally {
      setSavingScore(false);
    }
  };

  const playAgain = () => {
    setCoins(20);
    setRoute([]);
    setExecutionLog([]);
    setTimeLeft(90);
    setSetupTimeLeft(10); // Reset memorization timer
    setPhase('SETUP');
  };

  // --- RENDERERS ---
  if (loading) return <Container className="mt-5 text-center"><Spinner animation="border" /></Container>;
  if (error) return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>;

  // PHASE 1: SETUP
  if (phase === 'SETUP') {
    return (
      <Container className="mt-4">
        <div className="text-center mb-4">
          <h2>Phase 1: Setup</h2>
          <h3 className="text-danger fw-bold mt-2 mb-3">
             <i className="bi bi-clock me-2"></i> Memorize the map! Auto-starting in: {setupTimeLeft}s
          </h3>
          <h4><Badge bg="warning" text="dark">Starting Coins: {coins}</Badge></h4>
        </div>
        <Card className="shadow-sm mb-4 border-primary">
          <Card.Header className="bg-primary text-white">Underground Network Map</Card.Header>
          <Card.Body>
            {network.lines.map(line => (
              <div key={line.id} className="mb-4">
                <Badge bg="dark" className="me-2 fs-6 mb-2">{line.name}</Badge>
                <div className="d-flex flex-wrap align-items-center">
                  {network.connections.filter(c => c.line_id === line.id).map((c, index, array) => {
                    const station = network.stations.find(s => s.id === c.station_id);
                    return (
                      <span key={station.id} className="fw-semibold">
                        {station.name} {index < array.length - 1 && <span className="mx-2 text-danger">&rarr;</span>}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </Card.Body>
        </Card>
        <div className="text-center mt-4">
          <Button size="lg" variant="success" onClick={startPlanning}>I'm ready! Start Planning Phase</Button>
        </div>
      </Container>
    );
  }

  // PHASE 2: PLANNING
  if (phase === 'PLANNING') {
    return (
      <Container className="mt-4">
        <Row>
          <Col lg={8}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3>Phase 2: Planning</h3>
              <h3 className={timeLeft <= 15 ? "text-danger fw-bold" : "text-primary"}>
                <i className="bi bi-clock me-2"></i> 00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
              </h3>
            </div>
            <Card className="mb-4 shadow-sm">
              <Card.Header className="bg-secondary text-white">Stations (Lines Hidden)</Card.Header>
              <Card.Body>
                <div className="d-flex flex-wrap gap-2">
                  {network.stations.map(s => {
                    let variant = 'light';
                    if (s.id === startStation.id) variant = 'success';
                    if (s.id === destStation.id) variant = 'danger';
                    return <Badge key={s.id} bg={variant} text={variant === 'light' ? 'dark' : 'white'} className="border p-2">{s.name}</Badge>;
                  })}
                </div>
              </Card.Body>
            </Card>
            <Row className="mb-4">
              <Col sm={6}>
                <Card className="border-success text-center"><Card.Header className="bg-success text-white">Start</Card.Header><Card.Body><h5>{startStation?.name}</h5></Card.Body></Card>
              </Col>
              <Col sm={6}>
                <Card className="border-danger text-center"><Card.Header className="bg-danger text-white">Destination</Card.Header><Card.Body><h5>{destStation?.name}</h5></Card.Body></Card>
              </Col>
            </Row>
            <Card className="shadow-sm">
              <Card.Header className="bg-primary text-white">Your Route</Card.Header>
              <ListGroup variant="flush">
                {route.length === 0 ? <ListGroup.Item className="text-muted text-center py-4">Click segments to build your route.</ListGroup.Item> : route.map((seg, idx) => (
                  <ListGroup.Item key={idx} className="d-flex justify-content-between align-items-center">
                    <span><strong>Step {idx + 1}:</strong> {seg.name}</span>
                    <Button variant="outline-danger" size="sm" onClick={() => removeSegmentFromRoute(idx)}>X</Button>
                  </ListGroup.Item>
                ))}
              </ListGroup>
              <Card.Footer className="text-end">
                <Button variant="primary" onClick={submitRoute} disabled={route.length === 0}>Submit Route</Button>
              </Card.Footer>
            </Card>
          </Col>
          <Col lg={4} className="mt-4 mt-lg-0">
            <Card className="shadow-sm h-100">
              <Card.Header className="bg-dark text-white">Available Segments</Card.Header>
              <ListGroup variant="flush" className="overflow-auto" style={{ maxHeight: '600px' }}>
                {availableSegments.map(seg => (
                  <ListGroup.Item key={seg.id} action onClick={() => addSegmentToRoute(seg)} disabled={route.some(r => r.id === seg.id)}>
                    <small className="text-muted">{seg.line}</small><br/><strong>{seg.name}</strong>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  // PHASE 3: EXECUTION
  if (phase === 'EXECUTION') {
    const isFinished = !routeIsValid || currentStep >= route.length;
    return (
      <Container className="mt-4">
        <h2 className="text-center mb-4">Phase 3: Execution</h2>
        <Row className="justify-content-center mb-4">
          <Col md={8}>
            <Card className="text-center shadow-sm">
              <Card.Body>
                <h1 className="display-4"><i className="bi bi-coin text-warning me-3"></i>{coins}</h1>
                <p className="text-muted mb-0">Current Coins</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        
        {routeIsValid && (
          <div className="mb-4">
            <ProgressBar animated now={(currentStep / route.length) * 100} label={`Step ${currentStep} of ${route.length}`} />
          </div>
        )}

        <Card className="shadow-sm mb-4">
          <Card.Header className="bg-dark text-white">Travel Log</Card.Header>
          <ListGroup variant="flush" className="overflow-auto" style={{ maxHeight: '300px' }}>
            {executionLog.map((log, idx) => (
              <ListGroup.Item key={idx} variant={log.includes('EVENT') && log.includes('-') ? 'danger' : log.includes('EVENT') ? 'warning' : log.includes('INVALID') ? 'danger' : ''}>
                {log}
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Card>

        <div className="text-center">
          {!isFinished ? (
            <Button size="lg" variant="primary" onClick={executeNextStep}>Travel Next Segment</Button>
          ) : (
            <Button size="lg" variant="success" onClick={() => endGame(coins > 0 ? coins : 0)}>Finish Game & Save Score</Button>
          )}
        </div>
      </Container>
    );
  }

  // PHASE 4: RESULT
  if (phase === 'RESULT') {
    return (
      <Container className="mt-5 text-center">
        <Card className="shadow-lg border-0 mx-auto" style={{ maxWidth: '500px' }}>
          <Card.Body className="p-5">
            <h2 className="mb-4">Game Over!</h2>
            {savingScore ? (
              <Spinner animation="border" className="my-4" />
            ) : (
              <>
                <div className="display-1 text-success mb-3 fw-bold">{coins}</div>
                <h4 className="text-muted mb-4">Final Score (Coins)</h4>
                
                <div className="d-grid gap-3">
                  <Button variant="primary" size="lg" onClick={playAgain}>Play Again</Button>
                  <Button variant="outline-secondary" onClick={() => navigate('/rankings')}>View Global Rankings</Button>
                </div>
              </>
            )}
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return null;
}

export default GameLayout;