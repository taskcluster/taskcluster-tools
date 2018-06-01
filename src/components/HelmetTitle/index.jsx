import { Helmet, title } from 'react-helmet';

const HelmetTitle = props => (
  <Helmet>
    <title>
      {props.blank
        ? process.env.APPLICATION_NAME
        : `${props.title} | ${process.env.APPLICATION_NAME}`}
    </title>
  </Helmet>
);

export default HelmetTitle;
