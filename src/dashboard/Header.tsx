import * as React from 'react';
import Scrollspy from 'react-scrollspy';
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
import { PathRegion } from '../widgets/Utils';
import ModalVideo from 'react-modal-video';
import './modal-video.css';

interface HeaderProps {
  keyId: number;
  updateKeyId: (key: number) => void;
  layoutPresets: any;
  name?: string;
  pos: PathRegion[];
  onEdit: () => void;
}

interface HeaderState {
  keyId: number;
  isOpen: boolean;
  isMovieOpen: boolean;
  dropdownOpen: boolean;
  readmeDropdownOpen: boolean;
}

class Header extends React.Component<HeaderProps, HeaderState> {
  constructor(props: HeaderProps) {
    super(props);
    this.changeKeyId = this.changeKeyId.bind(this);
    this.toggle = this.toggle.bind(this);
    this.toggleDropdown = this.toggleDropdown.bind(this);
    this.toggleDropdownReadme = this.toggleDropdownReadme.bind(this);
    this.downloadRegions = this.downloadRegions.bind(this);
    this.openModal = this.openModal.bind(this);
    const isMovieOpen = location.hash.indexOf("demo-movie") > -1;
    this.state = {
      keyId: this.props.keyId,
      isOpen: false,
      dropdownOpen: false,
      readmeDropdownOpen: false,
      isMovieOpen,
    };
  }
  openModal () {
    this.setState({isMovieOpen: !this.state.isMovieOpen});
  }
  toggle() {
    this.setState({
      isOpen: !this.state.isOpen
    });
  }
  toggleDropdown() {
    this.setState({
      dropdownOpen: !this.state.dropdownOpen
    });
  }
  toggleDropdownReadme() {
    this.setState({
      readmeDropdownOpen: !this.state.readmeDropdownOpen
    });
  }
  changeKeyId(id: number) {
    this.props.updateKeyId(id);
  }
  downloadRegions() {
    const fasta = this.props.pos.map(a => a.toQuery()).join('\n');

    var svgBlob = new Blob([fasta], {type: 'text/plain'});
    var svgUrl = URL.createObjectURL(svgBlob);
    var downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = Date() + '.txt';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  }
  render() {
    return (
      <div className="top_nav" style={{ marginTop: '60px' }}>
        <ModalVideo channel='youtube' isOpen={this.state.isMovieOpen} videoId='mEXpFwf1K_M' onClose={() => this.setState({isOpen: false})} />
        <div className="nav_menu">
          <Navbar
            color="dark"
            dark
            expand="lg"
            fixed="top"
            style={{ padding: '0rem 1rem' }}>
            <NavbarBrand>
              <img
                src={require('./logo.png')}
                height="40px"
                style={{ background: 'white' }}
              />
            </NavbarBrand>
            <Nav className="ml-auto" navbar>
              <NavItem>
                <NavLink>
                  Modular Multi-scale Integrated Genome Graph Browser
                </NavLink>
              </NavItem>
            </Nav>
            <NavbarToggler onClick={this.toggle} />
            <Collapse isOpen={this.state.isOpen} navbar>
              <Nav className="ml-auto" navbar>
                <NavItem>
                  <NavLink>Ver 1.0</NavLink>
                </NavItem>
                <Scrollspy
                  componentTag="div"
                  className="navbar-nav"
                  items={['overall', 'graph', 'linear']}
                  currentClassName="active">
                  <NavItem>
                    <NavLink href="#overall">Overall</NavLink>
                  </NavItem>
                  <NavItem>
                    <NavLink href="#graph">Graph</NavLink>
                  </NavItem>
                  <NavItem>
                    <NavLink href="#linear">Linear</NavLink>
                  </NavItem>
                </Scrollspy>
                <Dropdown
                  nav
                  isOpen={this.state.readmeDropdownOpen}
                  toggle={this.toggleDropdownReadme}>
                  <DropdownToggle title="Select README" nav caret>
                    Manual
                  </DropdownToggle>
                  <DropdownMenu>
                    <DropdownItem
                      key={1}
                      href="https://momi-g.readthedocs.io/en/latest/"
                      target="_blank"
                      title="readme.english">
                      ReadtheDocs
                    </DropdownItem>
                    <DropdownItem
                      key={2}
                      onClick={this.openModal}
                      title="demo.english">
                      Demo Movie
                    </DropdownItem>
                    <DropdownItem
                      key={3}
                      onClick={this.downloadRegions}
                      target="_blank"
                      title="download.english">
                      Download
                    </DropdownItem>
                    {/*
                    <DropdownItem
                      key={2}
                      target="_blank"
                      href="./README.html"
                      title="readme.japanese">
                      Japanese
                    </DropdownItem>
                    */}
                  </DropdownMenu>
                </Dropdown>

                <Dropdown
                  nav
                  isOpen={this.state.dropdownOpen}
                  toggle={this.toggleDropdown}>
                  <DropdownToggle title="Select preset layout" nav caret>
                    Layout
                  </DropdownToggle>
                  <DropdownMenu>
                    <DropdownItem onClick={this.props.onEdit}>
                      Edit
                    </DropdownItem>
                    <DropdownItem divider />
                    {Object.keys(this.props.layoutPresets).map((a, i) => {
                      return (
                        <DropdownItem
                          key={i}
                          onClick={_ => this.changeKeyId(i)}>
                          {a}
                        </DropdownItem>
                      );
                    })}
                  </DropdownMenu>
                </Dropdown>
                <NavItem>
                  <NavLink disabled title="Name of dataset" href="#">
                    {this.props.name}
                  </NavLink>
                </NavItem>
              </Nav>
            </Collapse>
          </Navbar>
        </div>
      </div>
    );
  }
}

export default Header;
