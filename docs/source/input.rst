.. _input:

Custom Input
===================

This is an instruction for using custom input on MoMI-G. When you want to employ custom dataset, you have to do following procedure; see references.

1. Convert SV files into a vg format; use `MoMI-G tools <tools>`_ or generate variation graphs on their own. 
2. Put annotation files you want to visualize on the ``static/`` directory.
3. Modify `configuration file <configuration_file>`_ written in YAML.
  
MoMI-G data files
---------------

The list of formats that are accepted by MoMI-G is following. You should put them on the ``static/`` directory and specify the file name on the YAML configuration file. 
 
.. csv-table::
   :header: File type, Extension, Description, Softwares
   :widths: 25, 5, 50, 20

   A succinct index of variation graphs,	.xg,	Variation graphs displayed in MoMI-G. (required), vg
   Graphical alignment/map,	.gam,	Read alignment., vg
   Comma-separated values,	.csv(.pcf),	SV list for chromosome-scale view., MoMI-G tools
   Browser extensible data,	.bed,	Used for converting gene names to genomic intervals.,
   Compressed binary indexed BED,	.bb,	Annotation tracks., bedToBigBed
   Compressed binary indexed wiggle,	.bw,	Annotation tracks., bedGraphToBigWig

If you want to use bed/gff/gtf files for custom tracks on SequenceTubeMap, you have to manually convert them into bigbed format. 
