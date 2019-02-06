.. MoMI-G documentation master file, created by
   sphinx-quickstart on Wed Jan 30 10:52:45 2019.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

MoMI-G
==================================

.. toctree::
   :maxdepth: 2
   :caption: Getting Started:
   :hidden:

   quick_start
   why_momig
   view_modules

.. toctree::
   :maxdepth: 2
   :caption: References:
   :hidden:
   
   command_reference
   configure_file
   custom_layout
   tools

.. toctree::
   :maxdepth: 2
   :caption: Information:
   :hidden:

   project_info

.. image:: https://app.codeship.com/projects/8bd76f20-7c0f-0135-5019-1aa16f5e22b7/status?branch=master
    :target: https://app.codeship.com/projects/245600

.. image:: https://images.microbadger.com/badges/version/momigteam/momig-backend.svg
    :target: https://microbadger.com/images/momigteam/momig-backend

.. image:: https://badges.gitter.im/MoMI-G/community.png
    :target: https://gitter.im/MoMI-G/community

------
Modular Multi-scale Integrated Genome Graph Browser
------

`MoMI-G <https://github.com/MoMI-G/MoMI-G>`_ is a genome graph browser to visualize SVs on the variation graph, that provides a graph-based view that displays a genome with branches and alignments on them. Users can filter, visualize with genomic annotations, and inspect SVs with read alignments.

.. image:: intro.*

Demo
------------------

* Youtube
    * `Short Demo <https://youtu.be/Cv1OFREYtbU>`_
    * `Short Demo2 <https://youtu.be/mEXpFwf1K_M>`_
    * `Long Demo <https://youtu.be/dny_2t8CNFA>`_
* `Demo Page <http://demo.momig.tokyo/>`_

Install
------------------

We recommend to build the latest commit from github. If you encounter any issues, please report them using the `github issues <http://github.com/MoMI-G/MoMI-G/issues>`_ page.

.. code-block:: console

  $ git clone https://github.com/MoMI-G/MoMI-G
  $ cd MoMI-G
  $ yarn

Support
--------------

* For releases, see :ref:`Changelog <project_info>`_.
* To discuss with other users or post questions, you can use `gitter <https://gitter.im/MoMI-G/community>`_.
* For bugs and feature requests, please use the `issue tracker <https://github.com/MoMI-G/MoMI-G/issues>`_.
* For contributions, visit MoMI-G on `github <https://github.com/MoMI-G/MoMI-G>`_.

Citation
------------------

`Yokoyama, T., Sakamoto, Y., Seki, M., Suzuki, Y. & Kasahara, M. MoMI-G : Modular Multi-scale Integrated Genome Graph Browser. bioRxiv 1–39 (2019). <https://www.biorxiv.org/content/10.1101/540120v1>`_

License
------------------

MIT
