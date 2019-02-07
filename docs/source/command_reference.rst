.. _command_reference:

Parameter
===================

To get options, run

.. code-block:: console

   $ docker run momigteam/momig-backend ./graph-genome-browser-backend --help

You can specify parameters like this.

.. code-block:: console

   $ docker run momigteam/momig-backend ./graph-genome-browser-backend --intervals=100000

Options
--------------

.. _config:

config <string="config.yaml">
  A path to a configuration file.

http <string="127.0.0.1:8081">
  A host and port.

threads <int=1> (UNUSED)
  Threads per process.

tmp <string="./tmp">
  Cache folder for reducing computational time for subgrph retrieving by storing json generated from vg. 
  Caches can be permanent because subgraphs are stable unless you update a variation graph or read alignments. 
  Remove all caches when you update the data.

static <string="./static">
  Static files for providing csv file or bigWig/bigBed files. All files that serve as static files should be located in the static directory.

build <string="./build"> 
  A directory that includes MoMI-G frontend website. MoMI-G backend serves MoMI-G frontend; otherwise, you can directly serve MoMI-G frontend HTML/CSS/JS files via a reverse proxy such as nginx.

rocksdb <string="./rocksdb"> (OBSOLETE)
  This option remains for backward compatibility.

api <string="/api/v1/">
  A prefix of API endpoint. It is used for redirect to the static file.

interval <int=50000>
  A maximum threshold of an interval against the reference genome. When a request from client exceeeds the threshold, MoMI-G server returns an error.
