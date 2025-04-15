import { useState, useEffect, useCallback } from 'react';
import { Person, getPeople, addPerson, updatePerson, removePerson } from '../api/people';
import { Relationship, getRelationships, addRelationship, updateRelationship, removeRelationship } from '../api/relationships';

interface PersonNode extends Person {
    // Additional properties needed for the visualization
    id: string; // Alias for _id to work with the visualization
}

interface RelationshipEdge extends Relationship {
    // Additional properties needed for the visualization
    id: string; // Alias for _id to work with the visualization
}

// Custom hook to manage friendship network data
export const useFriendshipNetwork = (networkId: string | null) => {
    const [people, setPeople] = useState<PersonNode[]>([]);
    const [relationships, setRelationships] = useState<RelationshipEdge[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load network data
    const loadNetworkData = useCallback(async () => {
        if (!networkId) {
            setPeople([]);
            setRelationships([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Fetch people and relationships in parallel
            const [peopleData, relationshipsData] = await Promise.all([
                getPeople(networkId),
                getRelationships(networkId)
            ]);

            // Transform to add the id property needed by the visualization
            const peopleNodes: PersonNode[] = peopleData.map(person => ({
                ...person,
                id: person._id
            }));

            const relationshipEdges: RelationshipEdge[] = relationshipsData.map(rel => ({
                ...rel,
                id: rel._id
            }));

            setPeople(peopleNodes);
            setRelationships(relationshipEdges);
        } catch (err: any) {
            setError(err.message || 'Failed to load network data');
            console.error('Error loading network data:', err);
        } finally {
            setLoading(false);
        }
    }, [networkId]);

    useEffect(() => {
        loadNetworkData();
    }, [loadNetworkData]);

    // Add a new person
    const createPerson = async (personData: {
        firstName: string;
        lastName: string;
        birthday?: string;
        position?: { x: number; y: number }
    }): Promise<PersonNode> => {
        if (!networkId) throw new Error('No network selected');

        try {
            const newPerson = await addPerson(networkId, personData);
            const newPersonNode: PersonNode = { ...newPerson, id: newPerson._id };
            setPeople([...people, newPersonNode]);
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
            position?: { x: number; y: number }
        }
    ): Promise<PersonNode> => {
        if (!networkId) throw new Error('No network selected');

        try {
            const updatedPerson = await updatePerson(networkId, personId, personData);
            const updatedPersonNode: PersonNode = { ...updatedPerson, id: updatedPerson._id };

            setPeople(people.map(person =>
                person._id === personId ? updatedPersonNode : person
            ));

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
            setPeople(people.filter(person => person._id !== personId));

            // Remove all relationships involving this person
            setRelationships(relationships.filter(
                rel => rel.source !== personId && rel.target !== personId
            ));
        } catch (err: any) {
            setError(err.message || 'Failed to delete person');
            throw err;
        }
    };

    // Create a relationship
    const createRelationship = async (relationshipData: {
        source: string;
        target: string;
        type: 'freund' | 'partner' | 'familie' | 'arbeitskolleg' | 'custom';
        customType?: string;
    }): Promise<RelationshipEdge> => {
        if (!networkId) throw new Error('No network selected');

        try {
            const newRelationship = await addRelationship(networkId, relationshipData);
            const newRelationshipEdge: RelationshipEdge = { ...newRelationship, id: newRelationship._id };

            setRelationships([...relationships, newRelationshipEdge]);
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
        }
    ): Promise<RelationshipEdge> => {
        if (!networkId) throw new Error('No network selected');

        try {
            const updatedRelationship = await updateRelationship(networkId, relationshipId, relationshipData);
            const updatedRelationshipEdge: RelationshipEdge = { ...updatedRelationship, id: updatedRelationship._id };

            setRelationships(relationships.map(rel =>
                rel._id === relationshipId ? updatedRelationshipEdge : rel
            ));

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
            setRelationships(relationships.filter(rel => rel._id !== relationshipId));
        } catch (err: any) {
            setError(err.message || 'Failed to delete relationship');
            throw err;
        }
    };

    // Refresh the network data
    const refreshNetwork = async (): Promise<void> => {
        await loadNetworkData();
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
        refreshNetwork
    };
};