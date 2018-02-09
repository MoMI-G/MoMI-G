export class PathRegionPrototype {
  CHUNK = 1000;
  path: string;
  start?: number;
  stop?: number;
  authorized?: boolean;
  // There is no rule whether stop is greater than start.

  constructor(
    path: string,
    start?: number,
    stop?: number,
    authorized: boolean = true
  ) {
    this.path = path;
    this.start = authorized ? start || 0 : start;
    this.stop = !authorized
      ? stop
      : start === stop || !stop ? Number(start) + this.CHUNK : stop; // FIXME() It prohibits stop === stop cooridanetes/
    this.authorized = authorized;
  }

  canonicalPath() {
    return this.path.replace('chr', '');
  }

  compare(target: PathRegionPrototype) {
    return (
      this.path === target.path &&
      this.start === target.start &&
      this.stop === target.stop
    );
  }
  rescale(padding: number) {
    this.start -= padding;
    if (this.start < 0) {
      this.start = 0;
    }
    this.stop += padding;
    return this;
  }
  flip() {
    const tmp = this.start;
    this.start = this.stop;
    this.stop = tmp;
    return this;
  }
  scaleUp() {
    if (this.stop !== null) {
      const diff = this.stop - this.start;
      this.start += Math.round(diff / 4) - 1;
      this.stop -= Math.round(diff / 4);
      if (this.stop < 0) {
        this.stop = 0;
      }
    }
    return this;
  }
  scaleDown() {
    if (this.stop !== null) {
      const diff = this.stop - this.start;
      this.start -= Math.round(diff / 2) + 1;
      if (this.start < 0) {
        this.start = 0;
      }
      this.stop += Math.round(diff / 2);
    }
    return this;
  }
  scaleLeft() {
    const diff = this.stop - this.start;
    this.start -= Math.round(diff / 2);
    if (this.start < 0) {
      this.start = 0;
    }
    this.stop -= Math.round(diff / 2);
    return this;
  }
  scaleRight() {
    const diff = this.stop - this.start;
    this.start += Math.round(diff / 2);
    this.stop += Math.round(diff / 2);
    return this;
  }
  chunkLeft() {
    this.stop = this.start + this.CHUNK;
    return this;
  }
  chunkRight() {
    this.start = this.stop - this.CHUNK;
    if (this.start < 0) {
      this.start = 0;
    }
    return this;
  }
  diff() {
    return Math.abs(this.stop - this.start);
  }
  toUnreadableString() {
    return this.stop
      ? this.path + ':' + this.start + '-' + this.stop
      : this.path + ':' + (this.start === null ? '' : this.start);
  }
  toString() {
    return this.stop
      ? this.path +
          ':' +
          Utils.formatPretitter(this.start) +
          '-' +
          Utils.formatPretitter(this.stop)
      : this.path + ':' + Utils.formatPretitter(this.start);
  }

  toQuery() {
    return this.stop
      ? this.path + ':' + this.start + '-' + this.stop
      : this.path + ':' + (this.start === null ? '' : this.start);
  }
}

export type TagItem = string;

export class PathRegion extends PathRegionPrototype {
  name: TagItem[];
  isLocked?: boolean;
  constructor(
    path: string,
    start?: number,
    stop?: number,
    authorized?: boolean,
    name?: TagItem[],
    isLocked?: boolean
  ) {
    super(path, start, stop, authorized);
    this.name = name || [];
    this.isLocked = isLocked;
  }
  compareExact(target: PathRegion) {
    return (
      this.path === target.path &&
      this.start === target.start &&
      this.stop === target.stop &&
      this.name.toString() === target.name.toString()
    );
  }
}

export class PathRegionWithPrevLen extends PathRegionPrototype {
  previous: number;
  startIndex: number;
  stopIndex: number;
  constructor(
    path: string,
    start?: number,
    stop?: number,
    previous?: number,
    startIndex?: number,
    stopIndex?: number
  ) {
    super(path, start, stop);
    this.previous = previous || 0;
    this.startIndex = startIndex || 0;
    this.stopIndex = stopIndex || startIndex || 0;
  }
}

export class PathRegionArray {
  paths: PathRegion[];
  selectedIndex: number;
}

export interface OverViewProps {
  pos: PathRegion[];
  posUpdate: (reg: PathRegion[], featureId: number) => void;
  closeModal: () => void;
  featureThreshold: number[];
  featureSelection: boolean[];
  features: any;
  chroms: any;
  width: number;
  reference?: string;
}

export interface PartialGraphProps {
  width: number;
  height: number;
  chroms: any;
  pos: PathRegion[];
  nodesUpdate: (reg: number[]) => void;
  uuid: string;
  reference?: string;
}

export interface PathRegionProps {
  pos: PathRegion[];
  posUpdate: (
    reg: PathRegion[],
    featureId: number,
    updatedIndex?: number
  ) => void;
  posConcat: (reg: PathRegion[], featureId: number) => void; // It is useless;
  arrayMode: () => void;
  reference: string;
  chroms: any;
}

export class SPARQList {
  static offset: number = 0; // 5000;
  static buildSparqlistRequest(pos: PathRegionPrototype, ref: string = 'hg19') {
    const seq = pos.canonicalPath();
    const url = ref === 'hg19' ? '_grch37' : '';
    return (
      'http://demo.momig.tokyo/rest/api/vg_gene_annotation' +
      url +
      '?seq=' +
      seq +
      '&start=' +
      (pos.start - this.offset > 0 ? pos.start - this.offset : 0) +
      '&end=' +
      (pos.stop + this.offset)
    );
  }

  static convertToAnnotationFromSparqlist(
    res: any,
    pos: PathRegionWithPrevLen
  ) {

    var hash = {};
    res.forEach(item => {
      // TODO()
      if (hash[item.mrna.value] === undefined) {
        hash[item.mrna.value] = [];
      }
      hash[item.mrna.value].push(item);
    });
    const isoform = Object.keys(hash)
      .map(key => {
        const mrnaCoordinate = [
          hash[key][0].mrna_start.value,
          hash[key][0].mrna_end.value
        ]
          .map(a => Number(a))
          .sort();
        return {
          track: hash[key][0].transcript_id.value,
          path: pos.path,
          mrna_start: mrnaCoordinate[0],
          mrna_end: mrnaCoordinate[1],
          strand: hash[key][0].strand.value,
          name: hash[key][0].name.value,
          description: hash[key][0].description.value
        };
      })
      .filter(track => track.track.startsWith('NM')); // Limit annotations only NM
    const exon = res
      .map(item => {
        const exonCoordinate = [item.exon_start.value, item.exon_end.value]
          .map(a => Number(a))
          .sort();
        const mrnaCoordinate = [item.mrna_start.value, item.mrna_end.value]
          .map(a => Number(a))
          .sort();
        const startPosition = Math.max(mrnaCoordinate[0], pos.start);
        if (
          exonCoordinate[0] > pos.stop ||
          exonCoordinate[1] < pos.start ||
          !item.transcript_id.value.startsWith('NM')
        ) {
          return null;
        }
        return {
          track: item.name.value + ' (' + item.transcript_id.value + ')',
          start: exonCoordinate[0] - startPosition + pos.previous,
          end: exonCoordinate[1] - startPosition - 1 + pos.previous,
          type: 'exon',
          name: item.name.value
        };
      })
      .filter(a => a);
    return { isoform: isoform, exon: exon };
  }
}

export class Utils {
  static refToGRC(ref: string) {
    switch (ref) {
      case 'hg19':
        return 'GRCh37';
      case 'hg38':
        return 'GRCh38';
      default:
        return 'GRCh37';
    }
  }
  static refToNumber(ref: string) {
    switch (ref) {
      case 'hg19':
        return 0;
      case 'hg38':
        return 1;
      default:
        return 0;
    }
  }
  static numToReference(ref: number) {
    switch (Number(ref)) {
      case 0:
        return 'hg19';
      case 1:
        return 'hg38';
      default:
        return 'hg19';
    }
  }
  static arrayUniqueByName(array: any[]) {
    let hash = {};
    return array.filter((a, index, self) => {
      if (a === null || a.name in hash) {
        return false;
      } else {
        hash[a.name] = 1;
        return true;
      }
    });
  }
  static applyMixins(derivedCtor: any, baseCtors: any[]) {
    baseCtors.forEach(baseCtor => {
      Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
        derivedCtor.prototype[name] = baseCtor.prototype[name];
      });
    });
  }
  static formatPretitter(d?: number) {
    return d === null
      ? ''
      : String(d).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
  }
  static formatResetter(d: string) {
    return Number(d.replace(',', ''));
  }
  static checkValid(d: PathRegion[]) {
    return d.filter(a => a).length !== 0;
  }
  static strToRegion(item: string) {
    const items = item.split('&');
    return Utils.strsToRegion(items);
  }
  static strsToRegion(items: any, auth: boolean = true) {
    if (items[0] === '') {
      return [];
    }
    if (!Array.isArray(items)) {
      items = [items];
    }
    return items.map(item => {
      const name = item.split(':');

      if (name[0].match(/^[0-9]/)) {
        name[0] = 'chr' + name[0];
        // FIXME() Is it valid? all path incluing not reference path will be prefixed "chr"?
      }
      if (name[1] === '' || name[1] === undefined) {
        if (item.indexOf(':', item.length - 1) === item.length - 1) {
          return new PathRegion(name[0], null, null, auth);
        }
        return null;
      }
      var start = name[1].split(/-|—|–|\.\./);
      start[0] = start[0].replace(/[^0-9^\.]/g, '');
      if (start.length === 1) {
        return new PathRegion(name[0], parseInt(start[0], 10), null, auth);
      } else {
        start[1] = start[1].replace(/[^0-9^\.]/g, '');
        return new PathRegion(
          name[0],
          parseInt(start[0], 10),
          parseInt(start[1], 10),
          auth
        );
      }
    });
  }
  static strToLength(d: string, chroms: any) {
    var length = 0;
    chroms.forEach(chr => {
      if (chr.id === d) {
        length = chr.len;
      }
    });
    return length;
  }
  static strToColor(d: string, chroms: any) {
    var color = '';
    chroms.forEach(chr => {
      if (chr.id === d) {
        color = chr.color;
      }
    });
    return color;
  }
  static svTypeToColor(type: string) {
    switch (type) {
      case 'INS':
        return 'rgb(255,40,0)'; // RED
      case 'INV':
        return 'rgb(250,245,0)'; // Yellow
      case 'DEL':
        return 'rgb(0,65,255)'; // Blue
      case 'TRA':
        return 'black';
      case 'BND':
        return 'black';
      case 'UNK':
        return 'black';
      case 'DUP':
        return 'rgb(255,40,0)'; // RED
      default:
        return 'black';
    }
  }
}

export interface Helpable {
  link: () => string;
  help: () => React.ReactElement<null>;
}
