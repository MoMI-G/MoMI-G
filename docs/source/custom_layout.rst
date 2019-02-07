.. _custom_layout:

Custom Layout
===================

MoMI-G supports the custom layout of view modules; users can customize the view if they are not satisfied with the preset views.

You can modify the layout of view modules on GUI; You can modify the layout of view modules on the web browser, but you cannot save the custom layout because it is volatile. Alternatively, we recommend configuring the layout file manually.

See ``src/dashboard/preset.json``.

.. code-block:: json

  {
    "Default": {
      "rows": [
	{
	  "columns": [
	    {
	      "className": "col-md-6 col-sm-6 col-xs-6",
	      "widgets": [{ "key": "CircosWidget" }]
	    },
	    {
	      "className": "col-md-6 col-sm-6 col-xs-6",
	      "widgets": [
		{ "key": "ThresholdWidget" },
		{ "key": "FeatureTableWidget" }
	      ]
	    }
	  ]
	},
	{
	  "columns": [
	    {
	      "className": "col-md-12 col-sm-12 col-xs-12",
	      "widgets": [
		{ "key": "TubeMapWidget" },
		{ "key": "AnnotationWidget" }
	      ]
	    }
	  ]
	}
      ]
    }
  }

The layout is on the `dazzle <https://github.com/Raathigesh/dazzle>`_. You can select view modules from the following list.

.. csv-table::
   :header: Module name, View module, Description
   :widths: 15, 15, 40

   CircosWidget, Circos Plot, Observe the distribution of SVs
   FeatureTableWidget, Feature Table, Select and filter SVs
   ThresholdWidget, Threshold Filter, Filter SVs
   TubeMapWidget, SequenceTubeMap, Visualize a subgraph of a variation graph
   AnnotationWidget, Annotation Table, Show annotations 
   PileupWidget, Linear Browser, Visualize a linear genome with annotations
   PathRegionWidget, Interval Card Deck, Switch between the intervals

After modifying ``src/dashboard/preset.json``, you should rebuild MoMI-G frontend.
