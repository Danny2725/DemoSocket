// client/src/components/ParticipantList.tsx

import React from 'react';

interface Participant {
  id: string;
  name: string;
}

interface ParticipantListProps {
  participants: Participant[];
}

const ParticipantList: React.FC<ParticipantListProps> = ({ participants }) => {
  return (
    <div>
      <h2 className="text-xl font-bold mt-6">Participants</h2>
      <ul className="list-disc list-inside">
        {participants.map((participant, index) => (
          <li key={index} className="mt-2">{participant.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default ParticipantList;
