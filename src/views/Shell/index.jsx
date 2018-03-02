import Shell from './Shell';
import HelmetTitle from '../../components/HelmetTitle';

const View = ({ location }) => {
  const search = new URLSearchParams(location.search);
  const props = ['socketUrl', 'v', 'taskId'].reduce(
    (props, key) => ({ ...props, [key]: decodeURIComponent(search.get(key)) }),
    {}
  );

  return (
    <div>
      <HelmetTitle title="Shell" />
      <Shell {...props} />
    </div>
  );
};

export default View;
