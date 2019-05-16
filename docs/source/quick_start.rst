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

If you want to run the backend server on your laptop or workstation, we recommend using docker image of MoMI-G backend server. As an example, we provide CHM1 chr21 and simulated reads dataset. For running a demo, modify package.json and run docker container which includes backend server.

First, you have to install docker. See `here <https://docs.docker.com/install/>`_ for installation instructions.

Then, you have to change the backend URL from the MoMI-G public server to localhost, and run the backend server. 

.. code-block:: console

  $ sed -e "s/\"target/\"target_/g"  -e "s/\_target/target/g" -i.bak package.json
  $ docker run --init -p 8081:8081 momigteam/momig-backend # Run it on another shell. It takes a little long time -- please wait. 
  $ yarn start

You can start docker container by docker-compose up instead of docker run.

-------
Custom Backend For Latest VG
-------

If you want to use the latest version of vg, you have to change the version of vg used on backend server due to the compatibility of xg binary format. Therefore, we recommend using a custom build of docker binary.

First, you modify the first line of ``Dockerfile.backend`` to set vg's version you used.

.. code-block:: Dockerfile

  FROM quay.io/vgteam/vg:v1.14.0 as build

  # frontend container
  FROM momigteam/momig-backend

  COPY --from=build /vg/bin/vg /vg/bin/

  EXPOSE 8081

  CMD ["./graph-genome-browser-backend", "--config=static/config.yaml", "--interval=1500000", "--http=0.0.0.0:8081", "--api=/api/v2/"]

If you use ``vg:v1.6.0-213-gc0c19fe5-t126-run``, then the first line should be modified as ``FROM quay.io/vgteam/vg:v1.6.0-213-gc0c19fe5-t126-run as build``.

After that, you build the custom backend and run the built backend server instead of official docker image.

.. code-block:: console

  $ docker build -t momig-custom-backend -f Dockerfile.backend .
  $ docker run --init -p 8081:8081 momig-custom-backend