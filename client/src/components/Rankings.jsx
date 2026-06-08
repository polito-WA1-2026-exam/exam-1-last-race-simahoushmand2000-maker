import { useState, useEffect } from 'react';
import { Container, Table, Spinner, Alert } from 'react-bootstrap';
import API from '../API';

function Rankings() {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const data = await API.getRankings();
        setRankings(data);
      } catch (err) {
        setError('Failed to load global rankings.');
      } finally {
        setLoading(false);
      }
    };
    fetchRankings();
  }, []);

  if (loading) return <Container className="mt-5 text-center"><Spinner animation="border" /></Container>;
  if (error) return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>;

  return (
    <Container className="mt-5">
      <h2 className="mb-4 text-center">Global Rankings</h2>
      <Table striped bordered hover responsive className="shadow-sm">
        <thead className="table-dark">
          <tr>
            <th>Rank</th>
            <th>Player</th>
            <th>Best Score (Coins)</th>
          </tr>
        </thead>
        <tbody>
          {rankings.map((entry, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>{entry.username}</td>
              <td><strong>{entry.best_score}</strong></td>
            </tr>
          ))}
          {rankings.length === 0 && (
            <tr>
              <td colSpan="3" className="text-center">No games have been played yet!</td>
            </tr>
          )}
        </tbody>
      </Table>
    </Container>
  );
}

export default Rankings;