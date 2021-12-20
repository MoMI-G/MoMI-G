// import * as React from 'react';

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
          Utils.formatPrettier(this.start) +
          '-' +
          Utils.formatPrettier(this.stop)
      : this.path + ':' + Utils.formatPrettier(this.start);
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
  toStringWithNames() {
    return this.stop
      ? this.path + ':' + this.start + '-' + this.stop + '-' + this.name.join('-')
      : this.path + ':' + (this.start === null ? '' : this.start);
  }
  compareExact(target: PathRegion) {
    return (
      this.path === target.path &&
      this.start === target.start &&
      this.stop === target.stop &&
      this.name.toString() === target.name.toString()
    );
  }
  withPrevLen() {
    return new PathRegionWithPrevLen(this.path, this.start, this.stop);
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

export class Wigs {
  max: number;
  min: number;
  values: any;
  constructor(max: number, min: number, values: any) {
    this.max = max;
    this.min = min;
    this.values = values;
  }
}

export class PackAnnotation {
  static offset: number = 0;
  static interval: number = 100;
  // static mergeOption: number = 0;
  static buildAnnotationRequest(pos: PathRegionPrototype) {
    return ('/api/v2/static/pack.json'); // + pos.toQuery());
  }
  static buildAnnotationRequests(positions: PathRegionPrototype[]) {
    return ('/api/v2/static/pack.json'); // + positions.map(a => a.toQuery()).join(','));
  }
  static divide(n: number, ary: any[]) {
    var idx = 0;
    var results = [];
    var length = ary.length;

    while (idx + n < length) {
        var result = ary.slice(idx, idx + n);
        results.push(result);
        idx = idx + n;
    }

    var rest = ary.slice(idx, length + 1);
    results.push(rest);
    return results;
  }
  static convertToAnnotations(res: any, positions: PathRegionWithPrevLen[]): Wigs[] {
    // let hash = {};
    let key_length = Object.keys(res[0]).length;
    let temporal = new Array(key_length);
    for (let i = 0; i < key_length; i++ ) {
      temporal[i] = new Wigs(0, 100000, {});
    }
    
    res.forEach((response, index) => {
      Object.keys(response).forEach((key, temp_index) => {
        let wigs = response[key];
        // TODO()
        let array = [];
        wigs.forEach(wig => {
          for (let step = wig.start_offset; step < wig.stop_offset; step++) {
            if (positions[index].start <= step && step < positions[index].stop) {
              if (wig.value > temporal[temp_index].max) {
                temporal[temp_index].max = wig.value;
              }
              if (wig.value < temporal[temp_index].min) {
                temporal[temp_index].min = wig.value;
              }
              array.push(wig.value);
            }
          }
        });
              // Convolution with interval
        // temporal.forEach(arrayMaxMin => {
        let arrayMaxMin = temporal[temp_index];
        array = array.reduce((table, item) => {
          const last = table[table.length - 1];
          if (last.length >= array.length / PackAnnotation.interval) {
            table.push([item]);
            return table;
          }
          last.push(item);
          return table;
        },                   [[]]);
        array = array.map(item => item.reduce((a, b) => a > b ? a : b, 0)); 
        // Select Max coverage
        // array = array.filter((a, i) => i % WigAnnotation.interval === 0);
        if (array.length === 1) { // Since single-length lane cannot visualize
          array = [array[0], array[0]];
        }
        arrayMaxMin.values[positions[index].startIndex] = array;
        // console.log(hash);
        // });
      });
    });
    return temporal;
  }
  static convertToAnnotation(res: any, pos: PathRegionWithPrevLen) {
    // res = WIGTest;
    let max = res[0][0].value;
    let min = res[0][0].value;
    let hash = [];
    res.forEach(wigs => {
      // TODO()
      wigs.forEach(wig => {
        for (let step = wig.start_offset; step < wig.stop_offset; step++) {
          if (pos.start <= step && step < pos.stop) {
            if (wig.value > max) {
              max = wig.value;
            }
            if (wig.value < min) {
              min = wig.value;
            }
            hash.push(wig.value);
          }
        }
      });
    });
    return {
      max,
      min,
      values: hash,
    };
  }

}

export class WigAnnotation {
  static offset: number = 0;
  static interval: number = 100;
  // static mergeOption: number = 0;
  static buildAnnotationRequest(pos: PathRegionPrototype) {
    return ('/api/v2/region?format=wig&path=' + pos.toQuery());
  }
  static buildAnnotationRequests(positions: PathRegionPrototype[]) {
    return ('/api/v2/region?format=wig&multiple=true&path=' + positions.map(a => a.toQuery()).join(','));
  }
  static divide(n: number, ary: any[]) {
    var idx = 0;
    var results = [];
    var length = ary.length;

    while (idx + n < length) {
        var result = ary.slice(idx, idx + n);
        results.push(result);
        idx = idx + n;
    }

    var rest = ary.slice(idx, length + 1);
    results.push(rest);
    return results;
  }
  static convertToAnnotations(res: any, positions: PathRegionWithPrevLen[]): Wigs[] {
    // let hash = {};
    if (!res[0]) {
      return new Array();
    }
    let key_length = Object.keys(res[0]).length;
    let temporal = new Array(key_length);
    for (let i = 0; i < key_length; i++ ) {
      temporal[i] = new Wigs(0, 100000, {});
    }
    
    res.forEach((response, index) => {
      Object.keys(response).forEach((key, temp_index) => {
        let wigs = response[key];
        // TODO()
        let array = [];
        wigs.forEach(wig => {
          for (let step = wig.start_offset; step < wig.stop_offset; step++) {
            if (positions[index].start <= step && step < positions[index].stop) {
              if (wig.value > temporal[temp_index].max) {
                temporal[temp_index].max = wig.value;
              }
              if (wig.value < temporal[temp_index].min) {
                temporal[temp_index].min = wig.value;
              }
              array.push(wig.value);
            }
          }
        });
              // Convolution with interval
        // temporal.forEach(arrayMaxMin => {
        let arrayMaxMin = temporal[temp_index];
        array = array.reduce((table, item) => {
          const last = table[table.length - 1];
          if (last.length >= array.length / WigAnnotation.interval) {
            table.push([item]);
            return table;
          }
          last.push(item);
          return table;
        },                   [[]]);
        array = array.map(item => item.reduce((a, b) => a > b ? a : b, 0)); 
        // Select Max coverage
        // array = array.filter((a, i) => i % WigAnnotation.interval === 0);
        if (array.length === 1) { // Since single-length lane cannot visualize
          array = [array[0], array[0]];
        }
        arrayMaxMin.values[positions[index].startIndex] = array;
        // console.log(hash);
        // });
      });
    });
    return temporal;
  }
  static convertToAnnotation(res: any, pos: PathRegionWithPrevLen) {
    // res = WIGTest;
    let max = res[0][0].value;
    let min = res[0][0].value;
    let hash = [];
    res.forEach(wigs => {
      // TODO()
      wigs.forEach(wig => {
        for (let step = wig.start_offset; step < wig.stop_offset; step++) {
          if (pos.start <= step && step < pos.stop) {
            if (wig.value > max) {
              max = wig.value;
            }
            if (wig.value < min) {
              min = wig.value;
            }
            hash.push(wig.value);
          }
        }
      });
    });
    return {
      max,
      min,
      values: hash,
    };
  }
}
export class BedAnnotation {
  static offset: number = 0;
  static buildBedAnnotationRequest(pos: PathRegionPrototype) {
/*    const seq = pos.canonicalPath();
    const start = (pos.start - this.offset > 0 ? pos.start - this.offset : 0);
    const end = (pos.stop + this.offset);*/
    return ('/api/v2/region?format=bed&path=' + pos.toQuery());
  }

  static convertToAnnotation(res: any, pos: PathRegionWithPrevLen) {
    // res = BEDTest;
    let hash = {};
    Object.keys(res).forEach((key) => {
      let annotations = res[key];
      // TODO()
      annotations.forEach(annotation => {
        if (hash[annotation.id] === undefined) {
          hash[annotation.id] = [];
        }
        hash[annotation.id].push(annotation);
      });
    });
    const isoform = Object.keys(hash)
      .map(key => {
        const coordinate = [
          hash[key][0].start_offset,
          hash[key][0].stop_offset,
        ]
          .map(a => Number(a))
          .sort();
        return {
          track: hash[key][0].attributes[0] + '_' + hash[key][0].id,
          path: pos.path,
          type: 'bed', // repeat
          mrna_start: coordinate[0],
          mrna_end: coordinate[1],
          strand: hash[key][0].attributes[2],
          name: hash[key][0].attributes[0],
          description: hash[key][0].attributes.join(',')
        };
      });
      // .filter(track => track.track.startsWith('NM')); // Limit annotations only NM
    return { isoform };
  }
}

export class SPARQList {
  static offset: number = 0; // 5000;
  static buildSparqlistRequest(pos: PathRegionPrototype, ref: string = 'hg19') {
    const seq = pos.canonicalPath();
    const url = ref === 'hg19' ? '_grch37/' : '/';
    return (
      'http://biohackathon.org/rest/api/vg_gene_annotation' +
      url +
      '?seq=' +
      seq +
      '&start=' +
      (pos.start - this.offset > 0 ? pos.start - this.offset : 0) +
      '&end=' +
      (pos.stop + this.offset)
    );
  }

  static strandToString(strand: string) {
    switch (strand) {
      case '1':
        return '+';
      case '-1':
        return '-';
      default:
        return '?';
    }
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
          type: 'gene',
          mrna_start: mrnaCoordinate[0],
          mrna_end: mrnaCoordinate[1],
          strand: hash[key][0].strand.value,
          name: hash[key][0].name.value + ' / ' + hash[key][0].transcript_id.value + ' (' + this.strandToString(hash[key][0].strand.value) + ')',
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
          track: item.name.value + ' / ' + item.transcript_id.value + ' (' + this.strandToString(item.strand.value) + ')',
          start: exonCoordinate[0] - startPosition + pos.previous,
          end: exonCoordinate[1] - startPosition - 1 + pos.previous,
          type: 'exon',
          name: item.transcript_id.value
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
  static formatPrettier(d?: number) {
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
        name[0] = name[0];
        // FIXME() Does it make sense? all path incluing not reference path will be prefixed "chr"?
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
          auth,
          start.slice(2)
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
