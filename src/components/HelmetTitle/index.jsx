import { Helmet, title } from 'react-helmet';

const HelmetTitle = props => (
  <Helmet>
    <title>
      {props.blank ? 'Taskcluster' : `${props.title} | Taskcluster`}
    </title>
  </Helmet>
);

export default HelmetTitle;
