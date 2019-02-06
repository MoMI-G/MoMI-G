.. _quickstart:

MoMI-G Quick Start
===================

MoMI-G consists of two parts, frontend and backend (MoMI-G_backend). MoMI-G is available from source code. MoMI-G backend can be built from source courde, but we recommend to use docker image for reducing time for building backend server and setting up test environment.

--------
Frontend
--------

First, you have to install git, node, and npm or yarn. See `here <https://yarnpkg.com/lang/en/docs/install/>`_ for installation instructions. 

Then, you can build MoMI-G with

.. code-block:: console

  $ git clone https://github.com/MoMI-G/MoMI-G
  $ cd MoMI-G
  $ yarn

And access to http://localhost:3000/. The demo shows CHM1, a human hydatidiform mole cell line dataset from backend server of MoMI-G that MoMI-G developer serves.

-------
Backend
-------

If you want to run the backend server on your laptop or workstation, we recommend to use docker image of MoMI-G backend server. As an example, we provide CHM1 chr21 and simulated reads dataset. For running demo, modify package.json and run docker container which includes backend server.

First, you have to install docker. See `here <https://docs.docker.com/install/>`_ for installation instructions.

Then, you have to change the backend URL from the MoMI-G public server to localhost, and run the backend server. 

.. code-block:: console

  $ sed -e "s/\"target/\"target_/g"  -e "s/\_target/target/g" -i.bak package.json
  $ docker run --init -p 8081:8081 momigteam/momig-backend # Run it on another shell. It takes a little long time -- please wait. 
  $ yarn start

You can start docker container by docker-compose up instead of docker run.

