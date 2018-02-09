import * as React from 'react';
import {
  Collapse,
  Navbar,
  NavbarToggler,
  NavbarBrand,
  Nav,
  NavItem,
  NavLink,
  Dropdown,
  DropdownItem,
  DropdownToggle,
  DropdownMenu
} from 'reactstrap';
import { PathRegionProps } from '../widgets/Utils';
import Dnd from '../widgets/Dnd';

class Footer extends React.Component<PathRegionProps, {}> {
  constructor(props: PathRegionProps) {
    super(props);
  }
  render() {
    return (
      <div className="bottom_nav" style={{ marginTop: '50px' }}>
        <div className="nav_menu">
          <Navbar
            color="dark"
            dark
            expand="lg"
            fixed="bottom"
            style={{ padding: '0rem 0rem' }}
          >
            <Dnd {...this.props} />
          </Navbar>
        </div>
      </div>
    );
  }
}

export default Footer;
