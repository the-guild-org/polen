import React, { useMemo } from 'react';
import { GraphQLNamedType } from 'graphql';
import { useSearchParams } from 'react-router-dom';
import { Grafaid } from '../../utils/grafaid';
import { RootPositionType } from './RootPositionType';

export interface Props {
  types: readonly GraphQLNamedType[];
}

export const TreeView: React.FC<Props> = ({ types }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const openTypes = useMemo(
    () => new Set(searchParams.get('open')?.split(',').filter(Boolean) || []),
    [searchParams],
  );

  const toggleType = (typeName: string) => {
    const newOpenTypes = new Set(openTypes);
    if (newOpenTypes.has(typeName)) {
      newOpenTypes.delete(typeName);
    } else {
      newOpenTypes.add(typeName);
    }

    if (newOpenTypes.size === 0) {
      searchParams.delete('open');
    } else {
      searchParams.set('open', Array.from(newOpenTypes).join(','));
    }
    setSearchParams(searchParams);
  };

  const entryPoints = Grafaid.getEntryPointTypes(types);
  const otherTypes = Grafaid.getNonEntryPointTypes(types, entryPoints);

  return (
    <div
      style={{
        padding: '1rem',
        maxWidth: '100%',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
      }}
    >
      {entryPoints.length > 0 && (
        <div>
          <h2
            style={{
              fontSize: '1.1rem',
              fontWeight: 'normal',
              color: '#666',
              marginBottom: '1rem',
            }}
          >
            Entry Points
          </h2>
          {entryPoints.map(type => (
            <RootPositionType
              key={type.name}
              type={type}
              isExpanded={openTypes.has(type.name)}
              toggleType={toggleType}
              openTypes={openTypes}
            />
          ))}
        </div>
      )}

      {otherTypes.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h2
            style={{
              fontSize: '1.1rem',
              fontWeight: 'normal',
              color: '#666',
              marginBottom: '1rem',
            }}
          >
            Index
          </h2>
          {otherTypes.map(type => (
            <RootPositionType
              key={type.name}
              type={type}
              isExpanded={openTypes.has(type.name)}
              toggleType={toggleType}
              openTypes={openTypes}
            />
          ))}
        </div>
      )}
    </div>
  );
};
