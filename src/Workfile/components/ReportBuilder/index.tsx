import * as React from 'react';
import { RouteComponentProps } from 'react-router-dom';
var ContentEditable = require('react-contenteditable');
// import { button } from '../../../shared/components/button';
import { Checkbox } from '../../../shared/components/Checkbox';
import WorkfileService from '../../../services/workfiles';
import { Toolbar } from './Toolbar';
import * as utils from './utils';

import * as styles from './styles.css';
import { PageProps, ReportBuilderAction, Report, CloseFunction } from '../../../types/Report';
import { Tract as ITract, File as IFile, Sale as ISale } from '../../../types';
import ReportService from '../../../services/reports';

export interface ReportBuilderState {
  reports: Report[];
  analysis: Array<Array<Cell>>;
  pages: number;
  parseShortcodes: boolean;
  cursorPosition: number;
  italic: boolean;
  bold: boolean;
  underline: boolean;
  ul: boolean;
  ol: boolean;
  table: any;
  figure: any;
  tag: string;
  textAlign: string;
  zoom: number;
}

interface Cell {
  formula: string | null;
  value: string | null;
  error: string | null;
}

export interface ReportBuilderProps {
  tractId: string;
  workfileId: string;
}

export class ReportBuilder extends React.Component<
  RouteComponentProps<ReportBuilderProps>,
  ReportBuilderState
> {
  constructor(props: RouteComponentProps<ReportBuilderProps>) {
    super(props);
    this.state = {
      reports: [],
      analysis: [],
      pages: 1,
      parseShortcodes: true,
      cursorPosition: null,
      italic: false,
      bold: false,
      underline: false,
      ul: false,
      ol: false,
      table: false,
      figure: false,
      tag: '',
      textAlign: '',
      zoom: 100
    };
    this.getReports = this.getReports.bind(this);
    this.saveReport = this.saveReport.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.addPage = this.addPage.bind(this);
  }

  componentWillMount() {
    this.getReports();
    this.fetchWorkfileAnalysis();
  }

  componentDidMount() {
    document.addEventListener('selectionchange', this.handleSelectionChange, false);
  }

  getRandomSnap = snaps => snaps[Math.floor(Math.random() * snaps.length)];
  
  handleSelectionChange = () => {
    var selectionContext = utils.getSelectionContext();
    const fig = selectionContext.figure;
    const newFig = Object.assign({}, fig);
    const oldWidth = fig.node.children[0].width;
    const fullWidth = fig.node.offsetWidth;
    // divide the width into 4 snaps
    const snaps = [.25 *  fullWidth, .5 * fullWidth, .75 * fullWidth, 1 * fullWidth];
    // not able to get the current width while dragging using react-contenteditable
    // hence just taking a random snap instead to the closest snap
    let newWidth = this.getRandomSnap(snaps);
    newFig.node.children[0].width = newWidth.toString();  
    newFig.node.style['text-align']='left';
    if (!selectionContext) return;
    this.setState({   
      italic: selectionContext.italic,
      bold: selectionContext.bold,
      underline: selectionContext.underline,
      tag: selectionContext.tag,
      textAlign: selectionContext.textAlign,
      ul: selectionContext.ul,
      ol: selectionContext.ol,
      table: selectionContext.table,
      figure: newFig
    });
  };

  async fetchWorkfileAnalysis() {
    const workfileId = this.props.match.params.workfileId;
    try {
      const analysis: any = await WorkfileService.getSubjectAnalysis(workfileId);
      utils.init(analysis);
      this.setState({
        analysis: analysis
      });
    } catch (e) {
      console.log(e);
    }
  }

  FetchReports() {
    Promise.all([ReportService.getReports(this.props.match.params.workfileId)]).then(
      ([reports]) => {
        this.setState(() => ({
          reports: [{ report: JSON.parse(reports[0].report) }]
        }));
      }
    );
  }

  async saveReport() {
    var pages: any = document.querySelectorAll('.' + styles.page);
    const reports = await ReportService.createReport(this.props.match.params.workfileId, {
      report: JSON.stringify({ pages: utils.getPagesWithShortcodes(pages) })
    });
  }

  async getReports() {
    const reports = await ReportService.getReports(this.props.match.params.workfileId);
    this.setState({ reports: [{ report: JSON.parse(reports[0].report) }] });
  }

  handleChange(evt: any) {
    this.handleSelectionChange();
    var pages: any = document.querySelectorAll('.' + styles.page);
    var pageClones = [];
    var pagesHtml = [];
    for (let i = 0; i < pages.length; i++) {
      let page = pages[i];
      pagesHtml[i] = page.innerHTML;
    }
    this.setState({
      reports: [{ report: { pages: pagesHtml } }]
    });
  }

  addPage() {
    var pages = this.state.reports[0].report.pages;
    pages.push(' ');
    this.setState({ reports: [{ report: { pages: pages } }] });
  }

  execCommand(cmd: string) {
    document.execCommand(cmd, false, null);
  }

  formatBlock(tag: string) {
    document.execCommand('formatBlock', false, tag);
  }

  changeZoom = e => {
    this.setState({ zoom: e.target.value });
  };

  render() {
    var report: any = '';
    if (
      this.state.reports.length &&
      this.state.reports[0].report.pages &&
      this.state.analysis['data'] !== undefined
    ) {
      report = this.state.reports[0].report;
      var pages = [];
      for (let i = 0; i < report.pages.length; i++) {
        var parsedReport = report.pages[i];
        if (this.state.parseShortcodes) {
          var parsedReport = utils.parseShortcodes(report.pages[i], this.state.analysis);
        }
        pages.push(
            <ContentEditable key={i} html={parsedReport} disabled={false} onChange={this.handleChange} className={styles.page} id={"page" + i} />
          );
      }
    }
    return (
      <div className={styles.ReportBuilder}>
        <Toolbar
          workfileId={this.props.match.params.workfileId}
          saveReport={this.saveReport}
          addPage={this.addPage}
        >
          <div className={styles.buttonGroup}>
            <input type="number" value={this.state.zoom} onChange={this.changeZoom} />
          </div>
          <div className={styles.buttonGroup} style={{ display: 'none' }}>
            <Checkbox
              checked={this.state.parseShortcodes}
              onChange={() => {
                var pages: any = document.querySelectorAll('.' + styles.page);
                this.setState({
                  parseShortcodes: !this.state.parseShortcodes,
                  reports: [{ report: { pages: utils.getPagesWithShortcodes(pages) } }]
                });
              }}
              id="parseShortcodes"
            />
            Parse Shortcodes
          </div>
        </Toolbar>
        <div className={styles.pages}>
          <div style={{ zoom: this.state.zoom / 100 }}>{pages}</div>
        </div>
        <div className={styles.ContextSidebar}>
          {this.state.figure ? (
            <div className={styles.section + ' clearfix'}>
              <div className={styles.buttonGroup + ' clearfix'}>
                <h5>Image</h5>
                <label>
                  Width<br />
                  <input
                    type="number"
                    value={this.state.figure.width}
                    onChange={e => {
                      console.log("is this called now")
                      var figure = this.state.figure;
                      figure.width = e.target.value;
                      this.setState({
                        figure
                      });
                      this.state.figure.node.style.width = e.target.value + '%';
                    }}
                  />
                </label>
              </div>
              <div className={styles.buttonGroup}>
                <button
                  onClick={() => {
                    var figure = this.state.figure;
                    figure.float = 'left';
                    this.setState({
                      figure
                    });
                    this.state.figure.node.classList.remove(styles.center);
                    this.state.figure.node.classList.remove(styles.right);
                    this.state.figure.node.classList.add(styles.left);
                  }}
                  className={this.state.figure.float === 'left' ? styles.selected : ''}
                >
                  Float Left
                </button>
                <button
                  onClick={() => {
                    var figure = this.state.figure;
                    figure.float = 'center';
                    this.setState({
                      figure
                    });
                    this.state.figure.node.classList.remove(styles.left);
                    this.state.figure.node.classList.remove(styles.right);
                    this.state.figure.node.classList.add(styles.center);
                  }}
                  className={this.state.figure.float === 'center' ? styles.selected : ''}
                >
                  center
                </button>
                <button
                  onClick={() => {
                    var figure = this.state.figure;
                    figure.float = 'right';
                    this.setState({
                      figure
                    });
                    this.state.figure.node.classList.remove(styles.center);
                    this.state.figure.node.classList.remove(styles.left);
                    this.state.figure.node.classList.add(styles.right);
                  }}
                  className={this.state.figure.float === 'right' ? styles.selected : ''}
                >
                  Float Right
                </button>
              </div>
              <div className={styles.buttonGroup}>
                <button
                  onClick={() => {
                    var figure = this.state.figure;
                    figure.float = 'none';
                    this.setState({
                      figure
                    });
                    this.state.figure.node.classList.remove(styles.center);
                    this.state.figure.node.classList.remove(styles.left);
                    this.state.figure.node.classList.remove(styles.right);
                  }}
                  className={this.state.figure.float === 'none' ? styles.selected : ''}
                >
                  Float None
                </button>
              </div>
            </div>
          ) : (
            ''
          )}
          {this.state.table ? (
            <div className={styles.section + ' clearfix'}>
              <div className={styles.buttonGroup}>
                <h5>Table</h5>
                <label>
                  Width<br />
                  <input
                    type="number"
                    value={this.state.table.width}
                    onChange={e => {
                      var table = this.state.table;
                      table.width = e.target.value;
                      this.setState({
                        table
                      });
                      this.state.table.node.style.width = e.target.value + '%';
                    }}
                  />
                </label>
              </div>
              <div className={styles.buttonGroup}>
                <button
                  onClick={() => {
                    var table = this.state.table;
                    table.float = 'left';
                    this.setState({
                      table
                    });
                    this.state.table.node.classList.remove(styles.center);
                    this.state.table.node.classList.remove(styles.right);
                    this.state.table.node.classList.add(styles.left);
                  }}
                  className={this.state.table.float === 'left' ? styles.selected : ''}
                >
                  Float Left
                </button>
                <button
                  onClick={() => {
                    var table = this.state.table;
                    table.float = 'center';
                    this.setState({
                      table
                    });
                    this.state.table.node.classList.remove(styles.left);
                    this.state.table.node.classList.remove(styles.right);
                    this.state.table.node.classList.add(styles.center);
                  }}
                  className={this.state.table.float === 'center' ? styles.selected : ''}
                >
                  center
                </button>
                <button
                  onClick={() => {
                    var table = this.state.table;
                    table.float = 'right';
                    this.setState({
                      table
                    });
                    this.state.table.node.classList.remove(styles.center);
                    this.state.table.node.classList.remove(styles.left);
                    this.state.table.node.classList.add(styles.right);
                  }}
                  className={this.state.table.float === 'right' ? styles.selected : ''}
                >
                  Float Right
                </button>
              </div>
              <div className={styles.buttonGroup}>
                <button
                  onClick={() => {
                    var table = this.state.table;
                    table.float = 'none';
                    this.setState({
                      table
                    });
                    this.state.table.node.classList.remove(styles.center);
                    this.state.table.node.classList.remove(styles.left);
                    this.state.table.node.classList.remove(styles.right);
                  }}
                  className={this.state.figure.float === 'none' ? styles.selected : ''}
                >
                  Float None
                </button>
              </div>
            </div>
          ) : (
            ''
          )}
          <div className={styles.section + ' clearfix'}>
            <h5>Text</h5>
            <div className={styles.buttonGroup}>
              <select
                onChange={event => {
                  this.formatBlock(event.target.value);
                }}
                value={this.state.tag}
              >
                <option value="div">No Formatting</option>
                <option value="H1">Heading 1</option>
                <option value="H2">Heading 2</option>
                <option value="H3">Heading 3</option>
                <option value="H4">Heading 4</option>
                <option value="H5">Heading 5</option>
                <option value="P">Paragraph</option>
              </select>
            </div>
            <div className={styles.buttonGroup}>
              <button
                onClick={() => {
                  this.execCommand('italic');
                }}
                className={this.state.italic ? styles.selected : ''}
              >
                Italics
              </button>
              <button
                onClick={() => {
                  this.execCommand('bold');
                }}
                className={this.state.bold ? styles.selected : ''}
              >
                Bold
              </button>
              <button
                onClick={() => {
                  this.execCommand('underline');
                }}
                className={this.state.underline ? styles.selected : ''}
              >
                Underline
              </button>
            </div>
            <div className={styles.buttonGroup}>
              <button
                onClick={() => {
                  this.execCommand('justifyLeft');
                }}
                className={
                  this.state.textAlign === 'left' || this.state.textAlign === ''
                    ? styles.selected
                    : ''
                }
              >
                Justify Left
              </button>
              <button
                onClick={() => {
                  this.execCommand('justifyCenter');
                }}
                className={this.state.textAlign === 'center' ? styles.selected : ''}
              >
                Justify Center
              </button>
              <button
                onClick={() => {
                  this.execCommand('justifyRight');
                }}
                className={this.state.textAlign === 'right' ? styles.selected : ''}
              >
                Justify Right
              </button>
            </div>
            <div className={styles.buttonGroup}>
              <button
                onClick={() => {
                  this.execCommand('insertOrderedList');
                }}
                className={this.state.ol ? styles.selected : ''}
              >
                Ordered List
              </button>
              <button
                onClick={() => {
                  this.execCommand('insertUnorderedList');
                }}
                className={this.state.ul ? styles.selected : ''}
              >
                Unordered List
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
