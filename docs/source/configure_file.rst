.. _configure_file:

Configuration File
===================

MoMI-G backend requires a configuration file written in YAML which describes paths for datasets and the configuration about a reference genome.

Overview
-------------------

.. code-block:: yaml

  bin:
    vg: "vg"
    vg_tmp: "vg"
    graphviz: "dot"
    fa22bit: "faToTwobit"
    bigbed: "bedToBigBed"
  reference:
    chroms: "static/GRCh.json"
    data:
      - name: "hg19"
        features:
          - name: ""
            url: ""
            chr_prefix: ""
      - name: "hg38"
        features:
          - name: ""
            url: ""
            chr_prefix: ""
  data:
    - name: ""
      desc: ""
      chr_prefix: ""
      ref_id: ""
      source:
        xg: ""
        twobit: ""
        gamindex: ""
      features:
        - name: ''
          url: ''
          chr_prefix: ''
      static_files:
        - name: ''
          url: ''
          viz: ''

.. _config:

bin <string>
  A relative/absolute path for the binary. At least, the path for vg is required. Values for fa22bit, bigbed and graphviz are optionally and currently unused.
  vg_tmp is the same as the vg, but it is used for processing temporary uploaded files. Sometimes temporary uploaded files are stored in the separated directory, we can specify

reference <section>
  This section is used for describing a reference genome such as hg19 or hg38. You can write multiple reference genomes for sharing the same section between samples.

reference :> chroms <string="*.json"> 
  A relative/absolute path for chromosomal information. The json file includes the color and length for every chromosome. 
  You can use the preset chromosome color scheme attatched the MoMI-G backend for human dataset; otherwise you can manually write json file.

reference :> data :> features :> url <string="*.[bed|gff|gtf]">
  A relative/absolute path for genomic features which are indexed with the name of the feature.
  All intervals of genes/features written in this section are indexed, so you can query the gene/feature name for specifying the interval of it.

reference :> data :> features :> chr_prefix, data :> chr_prefix <string="" || string="chr">
  There are a few ways for representing chromosome 1. One might write "chr1"; the other might write "1". Specify prefix; then, the differences in prefix are implicitly handled.

data <section>
  This section is used for representing samples. You can write multiple data sources; but currently the first item of the data section is visualized.

data :> chr_prefix <string>
  There are a few ways for representing chromosome 1. One might write "chr1"; the other might write "1". Specify prefix; then, the differences in prefix are implicitly handled.

data :> ref_id <string="hg18"> 
  Ref_id is corresponding to the ``reference :> data :> name``. You can specify the reference genome of the given data for fetching genomic annotation from SPARQL endpoint. 

data :> source :> twobit <string="*.2bit"> (OBSOLETE)
  ``.2bit`` files are used in pileup.js for rendering reference nucleotides, but you should list twobit file on ``data :> static_files``. This option remains for backward compatibility.

data :> source :> gamindex <string="*.gam.index">
  Read alignments against genome graphs.
  Note that you should specify a `*.gam.index` file instead of `*.gam` file.
 
data :> features <section>
  All features written in this section are displayed on the custom track of SequenceTubeMap. The detail is the same as `reference :> data :> features`.

data :> features :> url <string="*.[bb|bw]">
  MoMI-G supports bigWig and bigBed format as data sources.

data :> static_files <section>
  All files written in this section are displayed on ``pileup.js`` used in the MoMI-G.

data :> static_files :> url <string="*.*">
  All files in this section should be a relative path from ``static`` folder specified in MoMI-G backend parameter or absolute URL started from ``http://`` or `https://`.

data :> static_files :> viz <string="[twobit|bigbed|variants|bam]">
  Specifying the type of static file is required to be displayed on ``pileup.js``. The following table describes the corresnponding viz keywords for supporting extensions.

=========  ========  =====================
extension  vis       pileup.js
=========  ========  =====================
.2bit      twobit    pileup.viz.genome()
.bb        bigbed    pileup.viz.genes()
.vcf       variants  pileup.viz.variants()
.bam       bam       pileup.formats.bam()
=========  ========  =====================

Example
----------------------

.. code-block:: yaml

  reference:
    chroms: "static/GRCh.json"
    data:
      - name: "hg19"
        features:
          - name: 'gene_annotation'
            url: "test/gencode.v25.basic.annotation.Y.bed"
            chr_prefix: "chr"
      - name: "hg38"
        features:
          - name: 'gene_annotation'
            url: "test/gencode.v25.basic.annotation.Y.bed"
            chr_prefix: "chr"
  data:
    - name: "na12878"
      chr_prefix: "chr"
      ref_id: "hg38"
      source:
        xg: "x5.xg"
      features: 
        - name: 'ensgene'
          url: "test/ensgene.bb"
          chr_prefix: "chr"
        - name: 'repeat_annotation'
          url: "test/repeats.bb"
          chr_prefix: "chr"
      static_files:
        - name: 'Reference'
          url: 'https://www.biodalliance.org/datasets/hg38.2bit'
          viz: 'twobit'
        - name: 'Genes'
          url: 'http://www.biodalliance.org/datasets/ensGene.bb'
          viz: 'bigbed'
        - name: 'Variants'
          url: './samples/remapped_NA12878.sorted.vcf'
          viz: 'variants'

Using vg docker image
----------------------

You can use docker image of vg instead of binary version of vg. If you want to use docker, you should specify the docker image on the ``bin`` section like following.

.. code-block:: yaml

  bin:
    vg: "/usr/local/bin/docker run --rm --memory-reservation 2G -i -v tmp:/tmp quay.io/vgteam/vg:v1.5.0-581-gc51e1acb-t67-run vg"
    vg_tmp: "/usr/local/bin/docker run --rm --memory-reservation 2G -i -v /tmp:/tmp quay.io/vgteam/v1.6.0-60-g515433ff-t120-run vg"

We recommend to limit the memory the container can use, but it does not guarantee that the container doesn’t exceed the limit because it is a soft limit.
