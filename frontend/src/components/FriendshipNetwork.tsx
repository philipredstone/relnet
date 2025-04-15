import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFriendshipNetwork } from '../hooks/useFriendshipNetwork';
import { useNetworks } from '../context/NetworkContext';

const FriendshipNetwork: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { networks } = useNetworks();
    const navigate = useNavigate();

    const {
        people,
        relationships,
        loading,
        error,
        createPerson,
        updatePerson,
        deletePerson,
        createRelationship,
        updateRelationship,
        deleteRelationship
    } = useFriendshipNetwork(id || null);

    // Local state for the UI
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [popupInfo, setPopupInfo] = useState<any | null>(null);
    const [newPerson, setNewPerson] = useState({
        firstName: '',
        lastName: '',
        birthday: ''
    });
    const [newRelationship, setNewRelationship] = useState({
        source: '',
        targets: [] as string[],
        type: 'freund',
        customType: ''
    });
    const svgRef = useRef<SVGSVGElement>(null);
    const nodeRefs = useRef<{ [key: string]: SVGGElement | null }>({});
    const [dragging, setDragging] = useState<string | null>(null);
    const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [showOverrideModal, setShowOverrideModal] = useState(false);
    const [overrideRelationship, setOverrideRelationship] = useState<any | null>(null);

    // Get current network info
    const currentNetwork = networks.find(network => network._id === id);

    // Redirect if network not found
    useEffect(() => {
        if (!loading && !currentNetwork && networks.length > 0) {
            navigate('/networks');
        }
    }, [currentNetwork, networks, loading, navigate]);

    // Add a new person to the network
    const handleAddPerson = async () => {
        if (newPerson.firstName.trim() === '' || newPerson.lastName.trim() === '') {
            alert('Please enter both first and last name');
            return;
        }

        try {
            await createPerson({
                firstName: newPerson.firstName.trim(),
                lastName: newPerson.lastName.trim(),
                birthday: newPerson.birthday || undefined,
                position: {
                    x: 100 + Math.random() * 400,
                    y: 100 + Math.random() * 300
                }
            });

            setNewPerson({
                firstName: '',
                lastName: '',
                birthday: ''
            });
        } catch (error) {
            console.error('Error adding person:', error);
            alert('Failed to add person.');
        }
    };

    // Add new relationships between source person and multiple target people
    const handleAddRelationship = async () => {
        const { source, targets, type, customType } = newRelationship;

        if (source === '' || targets.length === 0) {
            alert('Please select source and at least one target person');
            return;
        }

        const actualType = type === 'custom' ? customType.trim() : type;

        if (type === 'custom' && customType.trim() === '') {
            alert('Please enter a custom relationship type');
            return;
        }

        // Check if any relationships already exist
        const existingRelationships: any[] = [];
        targets.forEach(target => {
            if (source !== target) {
                const existingEdge = relationships.find(edge =>
                    (edge.source === source && edge.target === target) ||
                    (edge.source === target && edge.target === source)
                );

                if (existingEdge) {
                    existingRelationships.push({
                        source,
                        target,
                        existingType: existingEdge.type,
                        newType: actualType,
                        edgeId: existingEdge.id
                    });
                }
            }
        });

        if (existingRelationships.length > 0) {
            // Show override modal
            setOverrideRelationship({
                existingRelationships,
                newRelationships: targets.filter(target =>
                    source !== target && !existingRelationships.some(rel => rel.target === target)
                ).map(target => ({ source, target, type: actualType }))
            });
            setShowOverrideModal(true);
            return;
        }

        // Process each target for new relationships
        const addPromises = targets.map(target => {
            if (source !== target) {
                return createRelationship({
                    source,
                    target,
                    type: type as any,
                    customType: type === 'custom' ? customType : undefined
                });
            }
            return Promise.resolve();
        }).filter(Boolean);

        if (addPromises.length === 0) {
            alert('No valid relationships to add.');
            return;
        }

        try {
            await Promise.all(addPromises);
            setNewRelationship({ source: '', targets: [], type: 'freund', customType: '' });
        } catch (error) {
            console.error('Error adding relationships:', error);
            alert('Failed to add one or more relationships.');
        }
    };

    // Handle confirming relationship overrides
    const handleConfirmOverride = async () => {
        if (!overrideRelationship) return;

        const { existingRelationships, newRelationships } = overrideRelationship;

        try {
            // Remove existing relationships that will be overridden
            await Promise.all(existingRelationships.map(rel => deleteRelationship(rel.edgeId)));

            // Add new overridden relationships
            await Promise.all(existingRelationships.map(rel =>
                createRelationship({
                    source: rel.source,
                    target: rel.target,
                    type: rel.newType as any,
                    customType: rel.newType === 'custom' ? rel.customType : undefined
                })
            ));

            // Add completely new relationships
            await Promise.all(newRelationships.map(rel =>
                createRelationship({
                    source: rel.source,
                    target: rel.target,
                    type: rel.type as any,
                    customType: rel.type === 'custom' ? rel.customType : undefined
                })
            ));

            setShowOverrideModal(false);
            setOverrideRelationship(null);
            setNewRelationship({ source: '', targets: [], type: 'freund', customType: '' });
        } catch (error) {
            console.error('Error overriding relationships:', error);
            alert('Failed to override relationships.');
        }
    };

    // Handle canceling relationship overrides
    const handleCancelOverride = async () => {
        // If there are new relationships that don't need overrides, add those
        if (overrideRelationship && overrideRelationship.newRelationships.length > 0) {
            try {
                await Promise.all(overrideRelationship.newRelationships.map(rel =>
                    createRelationship({
                        source: rel.source,
                        target: rel.target,
                        type: rel.type as any,
                        customType: rel.type === 'custom' ? rel.customType : undefined
                    })
                ));
            } catch (error) {
                console.error('Error adding new relationships:', error);
            }
        }

        setShowOverrideModal(false);
        setOverrideRelationship(null);
    };

    // Handle multiple selections in the targets dropdown
    const handleTargetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
        setNewRelationship({...newRelationship, targets: selectedOptions});
    };

    // Handle node drag start
    const handleMouseDown = (e: React.MouseEvent, id: string) => {
        if (svgRef.current) {
            const node = people.find(n => n.id === id);
            if (!node) return;

            setDragging(id);
            setDragStartPos({ ...node.position });
            setMousePos({ x: e.clientX, y: e.clientY });

            e.stopPropagation();
            e.preventDefault();
        }
    };

    // Handle node dragging
    const handleMouseMove = (e: React.MouseEvent) => {
        if (dragging && svgRef.current) {
            const dx = e.clientX - mousePos.x;
            const dy = e.clientY - mousePos.y;

            const newX = dragStartPos.x + dx;
            const newY = dragStartPos.y + dy;

            // Update node position in the UI immediately
            const updatedPeople = people.map(node =>
                node.id === dragging
                    ? {
                        ...node,
                        position: { x: newX, y: newY }
                    }
                    : node
            );

            // We don't actually update the state here for performance reasons
            // Instead, we update the DOM directly
            const draggedNode = nodeRefs.current[dragging];
            if (draggedNode) {
                draggedNode.setAttribute('transform', `translate(${newX}, ${newY})`);
            }
        }
    };

    // Handle node drag end
    const handleMouseUp = async () => {
        if (dragging) {
            const node = people.find(n => n.id === dragging);
            if (node) {
                // Get the final position from the DOM
                const draggedNode = nodeRefs.current[dragging];
                if (draggedNode) {
                    const transform = draggedNode.getAttribute('transform');
                    if (transform) {
                        const match = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
                        if (match) {
                            const x = parseFloat(match[1]);
                            const y = parseFloat(match[2]);

                            // Save the new position to the server
                            try {
                                await updatePerson(dragging, { position: { x, y } });
                            } catch (error) {
                                console.error('Error updating position:', error);
                            }
                        }
                    }
                }
            }
            setDragging(null);
        }
    };

    // Delete a node and its associated edges
    const handleDeleteNode = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this person? All their relationships will also be deleted.')) {
            try {
                await deletePerson(id);
                setSelectedNode(null);
                setPopupInfo(null);
            } catch (error) {
                console.error('Error deleting person:', error);
                alert('Failed to delete person.');
            }
        }
    };

    // Get relationship type label
    const getRelationshipLabel = (type: string) => {
        switch(type) {
            case 'freund': return 'Freund/in';
            case 'partner': return 'Partner/in';
            case 'familie': return 'Familie/Verwandschaft';
            case 'arbeitskolleg': return 'Arbeitskolleg/innen';
            default: return type;
        }
    };

    // Remove a relationship between two people
    const handleRemoveRelationship = async (edgeId: string) => {
        try {
            await deleteRelationship(edgeId);

            // Update popup info if it's open
            if (popupInfo) {
                const nodeId = popupInfo.node.id;
                const nodeRelationships = relationships
                    .filter(edge => edge.id !== edgeId)
                    .filter(edge => edge.source === nodeId || edge.target === nodeId)
                    .map(edge => {
                        const otherId = edge.source === nodeId ? edge.target : edge.source;
                        const other = people.find(n => n.id === otherId);
                        return {
                            person: other ? `${other.firstName} ${other.lastName}` : otherId,
                            type: edge.type,
                            edgeId: edge.id
                        };
                    });

                setPopupInfo({
                    ...popupInfo,
                    relationships: nodeRelationships
                });
            }
        } catch (error) {
            console.error('Error removing relationship:', error);
            alert('Failed to remove relationship.');
        }
    };

    // Show popup with person details and relationships
    const showPersonDetails = (nodeId: string) => {
        const node = people.find(n => n.id === nodeId);
        if (!node) return;

        // Find all relationships
        const nodeRelationships = relationships.filter(
            edge => edge.source === nodeId || edge.target === nodeId
        ).map(edge => {
            const otherId = edge.source === nodeId ? edge.target : edge.source;
            const other = people.find(n => n.id === otherId);
            return {
                person: other ? `${other.firstName} ${other.lastName}` : otherId,
                type: edge.type,
                edgeId: edge.id
            };
        });

        setPopupInfo({
            node,
            relationships: nodeRelationships,
            position: { ...node.position }
        });
    };

    // Close popup
    const closePopup = () => {
        setPopupInfo(null);
    };

    // Get abbreviated name for display in graph (first name + first letter of last name)
    const getDisplayName = (node: any) => {
        return `${node.firstName} ${node.lastName.charAt(0)}.`;
    };

    // Close popup when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (popupInfo &&
                !(e.target as Element).closest('.popup') &&
                !dragging) {
                closePopup();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [popupInfo, dragging]);

    if (loading) {
        return <div className="flex justify-center p-8">Loading network data...</div>;
    }

    if (error) {
        return <div className="bg-red-100 border border-red-400 text-red-700 p-4 m-4 rounded">{error}</div>;
    }

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar menu */}
            <div className="w-64 bg-white p-4 border-r border-gray-200 overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">
                    {currentNetwork?.name || 'Friend Network'}
                </h2>

                {/* Add Person Form */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Add Person</h3>
                    <div className="mb-2">
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded mb-2"
                            placeholder="First Name"
                            value={newPerson.firstName}
                            onChange={e => setNewPerson({...newPerson, firstName: e.target.value})}
                        />
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded mb-2"
                            placeholder="Last Name"
                            value={newPerson.lastName}
                            onChange={e => setNewPerson({...newPerson, lastName: e.target.value})}
                        />
                        <input
                            type="date"
                            className="w-full px-3 py-2 border border-gray-300 rounded mb-2"
                            placeholder="Birthday (Optional)"
                            value={newPerson.birthday}
                            onChange={e => setNewPerson({...newPerson, birthday: e.target.value})}
                        />
                        <button
                            className="w-full bg-blue-500 text-white px-3 py-2 rounded"
                            onClick={handleAddPerson}
                        >
                            Add Person
                        </button>
                    </div>
                </div>

                {/* Add Relationship Form */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Add Relationship</h3>
                    <div className="mb-2">
                        <select
                            className="w-full px-3 py-2 border border-gray-300 rounded mb-2"
                            value={newRelationship.source}
                            onChange={e => setNewRelationship({...newRelationship, source: e.target.value})}
                        >
                            <option value="">Select first person</option>
                            {people.map(node => (
                                <option key={`source-${node.id}`} value={node.id}>
                                    {node.firstName} {node.lastName}
                                </option>
                            ))}
                        </select>

                        <select
                            className="w-full px-3 py-2 border border-gray-300 rounded mb-2"
                            multiple
                            size={Math.min(people.length, 5)}
                            value={newRelationship.targets}
                            onChange={handleTargetChange}
                        >
                            {people.map(node => (
                                <option key={`target-${node.id}`} value={node.id}>
                                    {node.firstName} {node.lastName}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mb-2">Hold Ctrl/Cmd to select multiple people</p>

                        <select
                            className="w-full px-3 py-2 border border-gray-300 rounded mb-2"
                            value={newRelationship.type}
                            onChange={e => setNewRelationship({...newRelationship, type: e.target.value})}
                        >
                            <option value="freund">Freund/in</option>
                            <option value="partner">Partner/in</option>
                            <option value="familie">Familie/Verwandschaft</option>
                            <option value="arbeitskolleg">Arbeitskolleg/innen</option>
                            <option value="custom">Custom...</option>
                        </select>

                        {newRelationship.type === 'custom' && (
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded mb-2"
                                placeholder="Enter custom relationship type"
                                value={newRelationship.customType}
                                onChange={e => setNewRelationship({...newRelationship, customType: e.target.value})}
                            />
                        )}

                        <button
                            className="w-full bg-green-500 text-white px-3 py-2 rounded"
                            onClick={handleAddRelationship}
                        >
                            Add Relationship
                        </button>
                    </div>
                </div>

                {/* People List */}
                <div>
                    <h3 className="text-lg font-semibold mb-2">People ({people.length})</h3>
                    <ul className="divide-y divide-gray-200">
                        {people.map(node => (
                            <li key={node.id} className="py-2 flex justify-between items-center">
                                <span>{node.firstName} {node.lastName}</span>
                                <button
                                    className="text-red-500 hover:text-red-700"
                                    onClick={() => handleDeleteNode(node.id)}
                                >
                                    Delete
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Relationships List */}
                <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-2">All Relationships ({relationships.length})</h3>
                    {relationships.length === 0 ? (
                        <p className="text-sm text-gray-500">No relationships yet</p>
                    ) : (
                        <ul className="divide-y divide-gray-200 max-h-40 overflow-y-auto text-sm">
                            {relationships.map(edge => {
                                const source = people.find(n => n.id === edge.source);
                                const target = people.find(n => n.id === edge.target);
                                if (!source || !target) return null;

                                return (
                                    <li key={edge.id} className="py-2">
                                        <div className="flex justify-between items-center">
                      <span>
                        {source.firstName} {source.lastName.charAt(0)}. ↔ {target.firstName} {target.lastName.charAt(0)}.
                      </span>
                                            <div className="flex items-center">
                                                <span className="text-xs text-gray-600 mr-2">{getRelationshipLabel(edge.type)}</span>
                                                <button
                                                    className="text-red-500 hover:text-red-700"
                                                    onClick={() => handleRemoveRelationship(edge.id)}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>

            {/* Visualization Area */}
            <div className="flex-1 p-4 relative">
                <svg
                    ref={svgRef}
                    className="w-full h-full bg-white border border-gray-200 rounded"
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    {/* Edges (Relationships) */}
                    {relationships.map(edge => {
                        const source = people.find(n => n.id === edge.source);
                        const target = people.find(n => n.id === edge.target);

                        if (!source || !target) return null;

                        // Determine the line color based on relationship type
                        let strokeColor = '#9CA3AF'; // Default gray
                        if (edge.type === 'freund') strokeColor = '#3B82F6'; // Blue
                        if (edge.type === 'partner') strokeColor = '#EC4899'; // Pink
                        if (edge.type === 'familie') strokeColor = '#10B981'; // Green
                        if (edge.type === 'arbeitskolleg') strokeColor = '#F59E0B'; // Yellow

                        return (
                            <g key={edge.id}>
                                <line
                                    x1={source.position.x}
                                    y1={source.position.y}
                                    x2={target.position.x}
                                    y2={target.position.y}
                                    stroke={strokeColor}
                                    strokeWidth="2"
                                />
                                <text
                                    x={(source.position.x + target.position.x) / 2}
                                    y={(source.position.y + target.position.y) / 2 - 10}
                                    textAnchor="middle"
                                    fill={strokeColor}
                                    fontSize="12"
                                    className="select-none"
                                >
                                    {getRelationshipLabel(edge.type)}
                                </text>
                            </g>
                        );
                    })}

                    {/* Nodes (People) */}
                    {people.map(node => (
                        <g
                            key={node.id}
                            transform={`translate(${node.position.x}, ${node.position.y})`}
                            onMouseDown={e => handleMouseDown(e, node.id)}
                            ref={el => { nodeRefs.current[node.id] = el; }}
                            className="cursor-grab"
                        >
                            <circle
                                r="30"
                                fill={selectedNode === node.id ? '#93C5FD' : '#DBEAFE'}
                                stroke="#3B82F6"
                                strokeWidth="2"
                                onClick={() => showPersonDetails(node.id)}
                            />
                            <text
                                textAnchor="middle"
                                dy=".3em"
                                fontSize="12"
                                fontWeight="bold"
                                className="select-none"
                            >
                                {getDisplayName(node)}
                            </text>
                        </g>
                    ))}
                </svg>

                {/* Person Details Popup */}
                {popupInfo && (
                    <div
                        className="popup absolute bg-white border border-gray-300 rounded shadow-lg p-4 z-10 w-64"
                        style={{
                            left: popupInfo.position.x > (svgRef.current?.clientWidth || 0) / 2
                                ? popupInfo.position.x - 260 : popupInfo.position.x + 40,
                            top: popupInfo.position.y > (svgRef.current?.clientHeight || 0) / 2
                                ? popupInfo.position.y - 200 : popupInfo.position.y,
                        }}
                    >
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-bold">Person Details</h3>
                            <button
                                className="text-gray-500 hover:text-gray-700"
                                onClick={closePopup}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="mb-4">
                            <p className="font-semibold">Name: {popupInfo.node.firstName} {popupInfo.node.lastName}</p>
                            {popupInfo.node.birthday && (
                                <p className="text-sm text-gray-600">Birthday: {new Date(popupInfo.node.birthday).toLocaleDateString()}</p>
                            )}
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2">Relationships:</h4>
                            {popupInfo.relationships.length === 0 ? (
                                <p className="text-sm text-gray-500">No relationships yet</p>
                            ) : (
                                <ul className="text-sm">
                                    {popupInfo.relationships.map((rel: any, index: number) => (
                                        <li key={index} className="mb-2 pb-1 border-b border-gray-100">
                                            <div className="flex justify-between mb-1">
                                                <span>{rel.person}</span>
                                                <span className="text-gray-600">{getRelationshipLabel(rel.type)}</span>
                                            </div>
                                            <div className="flex justify-end">
                                                <button
                                                    className="text-xs text-red-500 hover:text-red-700"
                                                    onClick={() => handleRemoveRelationship(rel.edgeId)}
                                                >
                                                    Remove Relationship
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                )}

                {/* Override Confirmation Modal */}
                {showOverrideModal && overrideRelationship && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full">
                            <h3 className="text-xl font-bold mb-4">Existing Relationship(s)</h3>
                            <p className="mb-4">
                                {overrideRelationship.existingRelationships.length === 1
                                    ? "There is already a relationship between these people:"
                                    : "There are already relationships between these people:"}
                            </p>

                            <ul className="mb-4 text-sm border rounded divide-y">
                                {overrideRelationship.existingRelationships.map((rel: any, index: number) => {
                                    const source = people.find(n => n.id === rel.source);
                                    const target = people.find(n => n.id === rel.target);
                                    if (!source || !target) return null;

                                    return (
                                        <li key={index} className="p-2">
                                            <div className="flex justify-between items-center">
                        <span>
                          {source.firstName} {source.lastName} ↔ {target.firstName} {target.lastName}
                        </span>
                                            </div>
                                            <div className="flex justify-between text-xs mt-1">
                        <span className="text-gray-600">
                          Current: {getRelationshipLabel(rel.existingType)}
                        </span>
                                                <span className="text-blue-600">
                          New: {getRelationshipLabel(rel.newType)}
                        </span>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>

                            <p className="mb-4">Do you want to override the existing relationship(s)?</p>

                            <div className="flex justify-end space-x-2">
                                <button
                                    className="px-4 py-2 border border-gray-300 rounded"
                                    onClick={handleCancelOverride}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="px-4 py-2 bg-blue-500 text-white rounded"
                                    onClick={handleConfirmOverride}
                                >
                                    Override
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Instructions */}
                <div className="absolute bottom-4 left-4 right-4 bg-white border border-gray-200 rounded p-2 text-sm">
                    <p><strong>Tip:</strong> Drag people to arrange them. Click on a person to view their details and relationships.</p>
                </div>
            </div>
        </div>
    );
};

export default FriendshipNetwork;