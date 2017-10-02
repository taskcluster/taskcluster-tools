import React from 'react';
import Clients from '../../components/Clients';
import ProvisionersDocs from './ProvisionersDocs';

const View = ({ match }) => (
  <Clients Queue>
    {clients => (
      <ProvisionersDocs
        {...clients}
        provisionerId={
          match.params.provisionerId ? match.params.provisionerId : ''
        }
      />
    )}
  </Clients>
);

export default View;
