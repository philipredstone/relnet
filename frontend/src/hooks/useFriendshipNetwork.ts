import { useCallback, useEffect, useRef, useState } from 'react';
import { addPerson, getPeople, Person, removePerson, updatePerson } from '../api/people';
import {
  addRelationship,
  getRelationships,
  Relationship, RELATIONSHIP_TYPES,
  removeRelationship,
  updateRelationship,
} from '../api/relationships';

interface PersonNode extends Person {
  // Additional properties needed for the visualization
  id: string; // Alias for _id to work with the visualization
}

interface RelationshipEdge extends Relationship {
  // Additional properties needed for the visualization
  id: string; // Alias for _id to work with the visualization
}

// Default poll interval in milliseconds (5 seconds)
const DEFAULT_POLL_INTERVAL = 5000;

// Custom hook to manage friendship network data
export const useFriendshipNetwork = (
  networkId: string | null,
  pollInterval = DEFAULT_POLL_INTERVAL,
) => {
  const [people, setPeople] = useState<PersonNode[]>([]);
  const [relationships, setRelationships] = useState<RelationshipEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollTimerRef = useRef<number | null>(null);
  const lastPeopleUpdateRef = useRef<string>('');
  const lastRelationshipsUpdateRef = useRef<string>('');

  // Load network data
  const loadNetworkData = useCallback(
    async (isPolling = false) => {
      if (!networkId) {
        setPeople([]);
        setRelationships([]);
        setLoading(false);
        return;
      }

      try {
        if (!isPolling) {
          setLoading(true);
        }
        setError(null);

        // Fetch people and relationships in parallel
        const [peopleData, relationshipsData] = await Promise.all([
          getPeople(networkId),
          getRelationships(networkId),
        ]);

        // Transform to add the id property needed by the visualization
        const peopleNodes: PersonNode[] = peopleData.map(person => ({
          ...person,
          id: person._id,
        }));

        const relationshipEdges: RelationshipEdge[] = relationshipsData.map(rel => ({
          ...rel,
          id: rel._id,
        }));

        // Generate hashes to detect changes
        const positionsHash = JSON.stringify(peopleNodes.map(p => ({ id: p.id, pos: p.position })));
        const relationshipsHash = JSON.stringify(
          relationshipEdges.map(r => ({ id: r.id, src: r.source, tgt: r.target, type: r.type })),
        );

        // Handle people updates
        const peopleChanged = positionsHash !== lastPeopleUpdateRef.current;
        const relsChanged = relationshipsHash !== lastRelationshipsUpdateRef.current;

        // Update states only if data has changed or it's the initial load
        if (peopleChanged || !isPolling) {
          if (isPolling && people.length > 0) {
            // During polling, only update nodes that have changed positions
            const currentPeopleMap = new Map(people.map(p => [p.id, p]));
            const updatedPeople = [...people];
            let hasChanges = false;

            // Check for position changes
            for (const newNode of peopleNodes) {
              const currentNode = currentPeopleMap.get(newNode.id);
              if (currentNode) {
                const currentPos = currentNode.position;
                const newPos = newNode.position;

                // Update if position changed
                if (currentPos.x !== newPos.x || currentPos.y !== newPos.y) {
                  const idx = updatedPeople.findIndex(p => p.id === newNode.id);
                  if (idx !== -1) {
                    updatedPeople[idx] = newNode;
                    hasChanges = true;
                  }
                }
              } else {
                // New node not in current state, add it
                updatedPeople.push(newNode);
                hasChanges = true;
              }
            }

            // Check for removed nodes
            const newNodeIds = new Set(peopleNodes.map(p => p.id));
            const removedNodes = updatedPeople.filter(p => !newNodeIds.has(p.id));
            if (removedNodes.length > 0) {
              const remainingPeople = updatedPeople.filter(p => newNodeIds.has(p.id));
              updatedPeople.length = 0;
              updatedPeople.push(...remainingPeople);
              hasChanges = true;
            }

            // Update state only if positions changed
            if (hasChanges) {
              setPeople(updatedPeople);
            }
          } else {
            // Initial load or major change - set everything
            setPeople(peopleNodes);
          }

          lastPeopleUpdateRef.current = positionsHash;
        }

        // Handle relationship updates similarly
        if (relsChanged || !isPolling) {
          if (isPolling && relationships.length > 0) {
            // Check for changes in relationships
            const currentRelsMap = new Map(relationships.map(r => [r.id, r]));
            const updatedRels = [...relationships];
            let hasRelChanges = false;

            // Add new or changed relationships
            for (const newRel of relationshipEdges) {
              const currentRel = currentRelsMap.get(newRel.id);
              if (!currentRel) {
                // New relationship
                updatedRels.push(newRel);
                hasRelChanges = true;
              } else if (
                currentRel.type !== newRel.type ||
                currentRel.source !== newRel.source ||
                currentRel.target !== newRel.target
              ) {
                // Changed relationship
                const idx = updatedRels.findIndex(r => r.id === newRel.id);
                if (idx !== -1) {
                  updatedRels[idx] = newRel;
                  hasRelChanges = true;
                }
              }
            }

            // Remove deleted relationships
            const newRelIds = new Set(relationshipEdges.map(r => r.id));
            const removedRels = updatedRels.filter(r => !newRelIds.has(r.id));
            if (removedRels.length > 0) {
              const remainingRels = updatedRels.filter(r => newRelIds.has(r.id));
              updatedRels.length = 0;
              updatedRels.push(...remainingRels);
              hasRelChanges = true;
            }

            if (hasRelChanges) {
              setRelationships(updatedRels);
            }
          } else {
            // Initial load or major change
            setRelationships(relationshipEdges);
          }

          lastRelationshipsUpdateRef.current = relationshipsHash;
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load network data');
        console.error('Error loading network data:', err);
      } finally {
        if (!isPolling) {
          setLoading(false);
        }
      }
    },
    [networkId],
  );

  // Set up polling for network data
  useEffect(() => {
    // Initial load
    loadNetworkData();

    // Set up polling if interval is provided and > 0
    if (networkId && pollInterval > 0) {
      // Clear any existing timer
      if (pollTimerRef.current) {
        window.clearInterval(pollTimerRef.current);
      }

      // Create new polling timer
      pollTimerRef.current = window.setInterval(() => {
        loadNetworkData(true);
      }, pollInterval);
    }

    // Cleanup function
    return () => {
      if (pollTimerRef.current) {
        window.clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [loadNetworkData, networkId, pollInterval]);

  // Add a new person
  const createPerson = async (personData: {
    firstName: string;
    lastName: string;
    birthday?: string;
    position?: { x: number; y: number };
  }): Promise<PersonNode> => {
    if (!networkId) throw new Error('No network selected');

    try {
      const newPerson = await addPerson(networkId, personData);
      const newPersonNode: PersonNode = { ...newPerson, id: newPerson._id };
      const updatedPeople = [...people, newPersonNode];
      setPeople(updatedPeople);

      // Update the reference hash to avoid unnecessary state updates on next poll
      lastPeopleUpdateRef.current = JSON.stringify(
        updatedPeople.map(p => ({ id: p.id, pos: p.position })),
      );

      return newPersonNode;
    } catch (err: any) {
      setError(err.message || 'Failed to create person');
      throw err;
    }
  };

  // Update a person
  const updatePersonData = async (
    personId: string,
    personData: {
      firstName?: string;
      lastName?: string;
      birthday?: string | null;
      position?: { x: number; y: number };
    },
  ): Promise<PersonNode> => {
    if (!networkId) throw new Error('No network selected');

    try {
      const updatedPerson = await updatePerson(networkId, personId, personData);
      const updatedPersonNode: PersonNode = { ...updatedPerson, id: updatedPerson._id };

      // Update the local state
      const updatedPeople = people.map(person =>
        person._id === personId ? updatedPersonNode : person,
      );
      setPeople(updatedPeople);

      // Update the reference hash if position changed to avoid unnecessary state updates on next poll
      if (personData.position) {
        lastPeopleUpdateRef.current = JSON.stringify(
          updatedPeople.map(p => ({ id: p.id, pos: p.position })),
        );
      }

      return updatedPersonNode;
    } catch (err: any) {
      setError(err.message || 'Failed to update person');
      throw err;
    }
  };

  // Remove a person
  const deletePerson = async (personId: string): Promise<void> => {
    if (!networkId) throw new Error('No network selected');

    try {
      await removePerson(networkId, personId);

      // Remove the person
      const updatedPeople = people.filter(person => person._id !== personId);
      setPeople(updatedPeople);

      // Remove all relationships involving this person
      const updatedRelationships = relationships.filter(
        rel => rel.source !== personId && rel.target !== personId,
      );
      setRelationships(updatedRelationships);

      // Update both reference hashes to avoid unnecessary state updates on next poll
      lastPeopleUpdateRef.current = JSON.stringify(
        updatedPeople.map(p => ({ id: p.id, pos: p.position })),
      );
      lastRelationshipsUpdateRef.current = JSON.stringify(
        updatedRelationships.map(r => ({ id: r.id, src: r.source, tgt: r.target, type: r.type })),
      );
    } catch (err: any) {
      setError(err.message || 'Failed to delete person');
      throw err;
    }
  };

  // Create a relationship
  const createRelationship = async (relationshipData: {
    source: string;
    target: string;
    type: RELATIONSHIP_TYPES;
    customType?: string;
  }): Promise<RelationshipEdge> => {
    if (!networkId) throw new Error('No network selected');

    try {
      const newRelationship = await addRelationship(networkId, relationshipData);
      const newRelationshipEdge: RelationshipEdge = { ...newRelationship, id: newRelationship._id };

      const updatedRelationships = [...relationships, newRelationshipEdge];
      setRelationships(updatedRelationships);

      // Update the relationship hash to avoid unnecessary state updates on next poll
      lastRelationshipsUpdateRef.current = JSON.stringify(
        updatedRelationships.map(r => ({ id: r.id, src: r.source, tgt: r.target, type: r.type })),
      );

      return newRelationshipEdge;
    } catch (err: any) {
      setError(err.message || 'Failed to create relationship');
      throw err;
    }
  };

  // Update a relationship
  const updateRelationshipData = async (
    relationshipId: string,
    relationshipData: {
      type?: 'freund' | 'partner' | 'familie' | 'arbeitskolleg' | 'custom';
      customType?: string;
    },
  ): Promise<RelationshipEdge> => {
    if (!networkId) throw new Error('No network selected');

    try {
      const updatedRelationship = await updateRelationship(
        networkId,
        relationshipId,
        relationshipData,
      );
      const updatedRelationshipEdge: RelationshipEdge = {
        ...updatedRelationship,
        id: updatedRelationship._id,
      };

      const updatedRelationships = relationships.map(rel =>
        rel._id === relationshipId ? updatedRelationshipEdge : rel,
      );
      setRelationships(updatedRelationships);

      // Update the relationship hash to avoid unnecessary state updates on next poll
      lastRelationshipsUpdateRef.current = JSON.stringify(
        updatedRelationships.map(r => ({ id: r.id, src: r.source, tgt: r.target, type: r.type })),
      );

      return updatedRelationshipEdge;
    } catch (err: any) {
      setError(err.message || 'Failed to update relationship');
      throw err;
    }
  };

  // Remove a relationship
  const deleteRelationship = async (relationshipId: string): Promise<void> => {
    if (!networkId) throw new Error('No network selected');

    try {
      await removeRelationship(networkId, relationshipId);
      const updatedRelationships = relationships.filter(rel => rel._id !== relationshipId);
      setRelationships(updatedRelationships);

      // Update the relationship hash to avoid unnecessary state updates on next poll
      lastRelationshipsUpdateRef.current = JSON.stringify(
        updatedRelationships.map(r => ({ id: r.id, src: r.source, tgt: r.target, type: r.type })),
      );
    } catch (err: any) {
      setError(err.message || 'Failed to delete relationship');
      throw err;
    }
  };

  // Refresh the network data
  const refreshNetwork = async (): Promise<void> => {
    await loadNetworkData();
  };

  // Update the poll interval
  const setPollInterval = (newInterval: number) => {
    // Clear existing timer
    if (pollTimerRef.current) {
      window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }

    // Set up new timer if interval > 0
    if (newInterval > 0 && networkId) {
      pollTimerRef.current = window.setInterval(() => {
        loadNetworkData(true);
      }, newInterval);
    }
  };

  return {
    people,
    relationships,
    loading,
    error,
    createPerson,
    updatePerson: updatePersonData,
    deletePerson,
    createRelationship,
    updateRelationship: updateRelationshipData,
    deleteRelationship,
    refreshNetwork,
    setPollInterval,
  };
};
