import { FC, useEffect } from 'react';
import { GraphQLNamedType } from 'graphql';
import { Link, useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { TypeLink } from './TypeLink';
import { ArgumentDetails } from './ArgumentDetails';

export interface Props {
  type: GraphQLNamedType;
}

export const TypeDetails: FC<Props> = ({ type }) => {
  // Cast to any GraphQL type that might have fields
  const fields = 'getFields' in type ? (type as any).getFields() : null;
  const location = useLocation();

  // Scroll to field if hash is present
  useEffect(() => {
    if (location.hash) {
      const fieldId = location.hash.slice(1); // Remove the # from the hash
      const element = document.getElementById(fieldId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [location.hash]);

  return (
    <div className="type-details">
      <h2>{type.name}</h2>
      {fields
        ? (
          <div className="fields-list">
            {Object.entries(fields).map(([fieldName, field]: [string, any]) => (
              <div key={fieldName} id={fieldName} className="field-item">
                <div className="field-header">
                  <Link
                    to={`#${fieldName}`}
                    className={`field-name ${
                      location.hash === `#${fieldName}` ? 'highlighted' : ''
                    }`}
                    title="Direct link to this field"
                  >
                    {fieldName}
                  </Link>
                  <TypeLink type={field.type} />
                </div>
                {field.description && (
                  <div className="field-description">
                    <ReactMarkdown>{field.description}</ReactMarkdown>
                  </div>
                )}
                {field.args?.length > 0 && (
                  <div className="arguments-list">
                    <h4 className="arguments-title">Arguments</h4>
                    {field.args.map((arg: any) => <ArgumentDetails key={arg.name} arg={arg} />)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
        : <pre>{type.toString()}</pre>}
    </div>
  );
};
