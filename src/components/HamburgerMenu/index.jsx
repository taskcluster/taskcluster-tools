import { string, func } from 'prop-types';
import classNames from 'classnames';
import { Button } from 'react-bootstrap';
import { menuButton, iconBar } from './styles.module.css';

const HamburgerMenu = props => {
  const { className, onClick } = props;

  return (
    <Button className={classNames(menuButton, className)} onClick={onClick}>
      <span className="sr-only">Toggle menu</span>
      <span className={iconBar} />
      <span className={iconBar} />
      <span className={iconBar} />
    </Button>
  );
};

HamburgerMenu.propTypes = {
  className: string,
  onClick: func
};

HamburgerMenu.defaultProps = {
  className: null,
  onClick: null
};

export default HamburgerMenu;
