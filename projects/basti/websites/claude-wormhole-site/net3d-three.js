/* THREE_NET — standalone WebGL 3D network renderer for Three.js r128 (UMD global THREE).
   No ES modules, no imports, no OrbitControls. Offline-capable.
   Exposes: window.THREE_NET = { create(canvas){ ... return api; } } */
(function () {
  "use strict";

  if (typeof THREE === "undefined") {
    console.error("THREE_NET: global THREE (r128 UMD) is required.");
  }

  var GREEN = "#4f6f3f";

  var THEMES = {
    dark: {
      bg: "#1a130a", fog: "#160f07",
      nodeBase: "#cdbb90", nodeHot: "#d99e28",
      edge: "#7a5a2e", label: "#f0e6c8"
    },
    paper: {
      bg: "#cdb583", fog: "#c2a771",
      nodeBase: "#d8c79c", nodeHot: "#bf8c20",
      edge: "#7c5e28", label: "#3a2c18"
    }
  };

  function create(canvas) {
    // ---- Renderer ----
    var renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: false
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    var maxAniso = (renderer.capabilities && renderer.capabilities.getMaxAnisotropy) ? renderer.capabilities.getMaxAnisotropy() : 1;

    var scene = new THREE.Scene();

    // ---- Camera ----
    var camera = new THREE.PerspectiveCamera(50, 1, 1, 8000);
    camera.position.set(0, 0, 520);

    // ---- Group that holds all graph meshes (rotation/pan applied here) ----
    var group = new THREE.Group();
    scene.add(group);

    // ---- Lights (soft) ----
    var ambient = new THREE.AmbientLight(0xffffff, 0.65);
    var dirA = new THREE.DirectionalLight(0xffffff, 0.7);
    dirA.position.set(220, 320, 280);
    var dirB = new THREE.DirectionalLight(0xffffff, 0.35);
    dirB.position.set(-260, -180, -200);
    scene.add(ambient);
    scene.add(dirA);
    scene.add(dirB);

    // ---- Fog ----
    scene.fog = new THREE.Fog(0x160f07, 600, 1600);

    // ---- Qualität (einstellbar via setQuality) – Standard „Hoch", deutlich runder als zuvor ----
    var quality = { sphereSeg: 48, sphereSegH: 36, cylSeg: 16, dprCap: 2 };

    // ---- Shared geometries (aus der Qualität gebaut, bei Änderung neu erzeugt) ----
    var sphereGeo, cylGeo;
    function buildGeometries() {
      sphereGeo = new THREE.SphereGeometry(1, quality.sphereSeg, quality.sphereSegH);  // unit sphere, scaled per node
      cylGeo = new THREE.CylinderGeometry(1, 1, 1, quality.cylSeg);                     // unit cylinder, oriented per edge
    }
    buildGeometries();

    // ---- State ----
    var theme = THEMES.dark;

    var params = {
      nodeSize: 16,
      influencer: 0.6,
      labelSize: 30,
      edgeWidth: 1.6,
      glow: 1.0,
      fog: 1.0,
      vignette: 0.0,
      showLabels: true,
      showShadow: true,
      labelMax: Infinity   // Perf: bei großen Netzen nur die wichtigsten (höchster Grad) Labels zeigen
    };

    var graph = null;

    // Per-build resources to dispose on rebuild
    var nodeMeshes = [];   // { mesh, name, baseRadius, deg, hot, path }
    var edgeMeshes = [];   // { mesh, ax,ay,az, bx,by,bz, path }
    var labelSprites = []; // { sprite, texture, material, name, aspect, node }
    var nodeByName = {};   // name -> node record (für Laufzeit-Färbung / Ausbreitung)
    var edgeByKey = {};    // "a|b" (sortiert) -> edge record
    var sceneR = 200;      // Hüll-Radius des aktuellen Layouts → skaliert Fog + Far-Plane mit der Spreizung

    // ---------- helpers ----------
    function clearBuilt() {
      var i, o;
      for (i = 0; i < nodeMeshes.length; i++) {
        o = nodeMeshes[i];
        group.remove(o.mesh);
        if (o.mesh.material) o.mesh.material.dispose();
      }
      for (i = 0; i < edgeMeshes.length; i++) {
        o = edgeMeshes[i];
        group.remove(o.mesh);
        if (o.mesh.material) o.mesh.material.dispose();
      }
      for (i = 0; i < labelSprites.length; i++) {
        o = labelSprites[i];
        group.remove(o.sprite);
        if (o.material) o.material.dispose();
        if (o.texture) o.texture.dispose();
      }
      nodeMeshes = [];
      edgeMeshes = [];
      labelSprites = [];
    }

    function makeLabelTexture(text, color) {
      var pad = 28;
      var font = 110; // hohe Render-Auflösung → scharfe Labels auch beim Heranzoomen
      var label = (text == null) ? "" : String(text);
      var c = document.createElement("canvas");
      var ctx = c.getContext("2d");
      ctx.font = "Bold " + font + "px Georgia, 'Times New Roman', serif";
      var measured = ctx.measureText(label).width;
      var w = Math.ceil(measured) + pad * 2;
      var h = font + pad * 2;
      if (w < pad * 2 + 2) w = pad * 2 + 2; // guard against zero-width labels
      // Setting canvas width/height resets the 2D context, so re-acquire + re-set state.
      c.width = w;
      c.height = h;
      ctx = c.getContext("2d");
      ctx.clearRect(0, 0, w, h);
      ctx.font = "Bold " + font + "px Georgia, 'Times New Roman', serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      // subtle shadow for legibility on any background
      ctx.shadowColor = "rgba(0,0,0,0.55)";
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;
      ctx.fillStyle = color;
      ctx.fillText(label, w / 2, h / 2);
      var tex = new THREE.CanvasTexture(c); // CanvasTexture sets needsUpdate=true itself
      tex.minFilter = THREE.LinearFilter;  // NPOT-sicher (WebGL1, r128) → keine Mipmaps
      tex.magFilter = THREE.LinearFilter;  // weiches Vergrößern; Schärfe kommt aus hoher Quell-Auflösung
      tex.generateMipmaps = false;
      tex.anisotropy = maxAniso;           // harmlos falls ohne Mipmaps wirkungslos
      tex.aspect = w / h; // stashed for sprite scaling (non-standard, harmless)
      return tex;
    }

    function orientCylinder(mesh, ax, ay, az, bx, by, bz, radius) {
      var dx = bx - ax, dy = by - ay, dz = bz - az;
      var len = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (len < 1e-6) len = 1e-6;
      // midpoint
      mesh.position.set((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2);
      // cylinder default axis is +Y; rotate Y to the edge direction
      var dir = new THREE.Vector3(dx, dy, dz).normalize();
      var up = new THREE.Vector3(0, 1, 0);
      var quat = new THREE.Quaternion().setFromUnitVectors(up, dir);
      mesh.quaternion.copy(quat);
      mesh.scale.set(radius, len, radius);
    }

    // ---------- API: setGraph ----------
    function setGraph(g) {
      graph = g || null;
      clearBuilt();
      nodeByName = {};
      edgeByKey = {};
      if (!graph || !graph.names) return;

      var names = graph.names;
      var positions = graph.positions || {};
      var edges = graph.edges || [];
      var deg = graph.deg || {};
      var maxDeg = graph.maxDeg || 1;
      if (maxDeg < 1) maxDeg = 1;
      var hot = graph.hot || {};
      var pathNodes = graph.pathNodes || {};
      var pathEdges = graph.pathEdges || {};

      // Hüll-Radius bestimmen → Fog/Far-Plane skalieren mit (auch sehr großer) Spreizung mit
      sceneR = 0;
      for (var si = 0; si < names.length; si++) { var sp = positions[names[si]]; if (sp) { var sd = Math.sqrt(sp.x * sp.x + sp.y * sp.y + sp.z * sp.z); if (sd > sceneR) sceneR = sd; } }
      if (!(sceneR > 1)) sceneR = 200;
      var wantFar = Math.max(8000, sceneR * 12);
      if (Math.abs(camera.far - wantFar) > 1) { camera.far = wantFar; camera.updateProjectionMatrix(); }

      var i, name, p;

      // Nodes
      for (i = 0; i < names.length; i++) {
        name = names[i];
        p = positions[name] || { x: 0, y: 0, z: 0 };
        var isHot = !!hot[name];
        var onPath = !!pathNodes[name];

        var mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(isHot ? theme.nodeHot : theme.nodeBase),
          roughness: 0.55,
          metalness: 0.15,
          emissive: new THREE.Color(0x000000),
          emissiveIntensity: 1.0,
          fog: true
        });

        var mesh = new THREE.Mesh(sphereGeo, mat);
        mesh.position.set(p.x, p.y, p.z);

        var nodeRec = {
          mesh: mesh,
          name: name,
          baseRadius: params.nodeSize * 0.9,
          deg: deg[name] || 0,
          hot: isHot,
          path: onPath
        };
        nodeMeshes.push(nodeRec);
        nodeByName[name] = nodeRec;
        group.add(mesh);

        // Label sprite
        var tex = makeLabelTexture(name, theme.label);
        var spMat = new THREE.SpriteMaterial({
          map: tex,
          transparent: true,
          depthTest: true,
          depthWrite: false,
          fog: false
        });
        var sprite = new THREE.Sprite(spMat);
        sprite.position.set(p.x, p.y, p.z);
        sprite.visible = !!params.showLabels;
        labelSprites.push({
          sprite: sprite,
          texture: tex,
          material: spMat,
          name: name,
          aspect: tex.aspect || 3,
          node: nodeRec // direct reference, no fragile index coupling
        });
        group.add(sprite);
      }

      // Edges
      for (i = 0; i < edges.length; i++) {
        var e = edges[i];
        var a = e[0], b = e[1];
        var pa = positions[a], pb = positions[b];
        if (!pa || !pb) continue;
        var key1 = a + "|" + b, key2 = b + "|" + a;
        var onPathEdge = !!(pathEdges[key1] || pathEdges[key2]);

        var emat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(onPathEdge ? GREEN : theme.edge),
          roughness: 0.7,
          metalness: 0.05,
          emissive: new THREE.Color(onPathEdge ? GREEN : 0x000000),
          emissiveIntensity: onPathEdge ? 0.35 : 0.0,
          fog: true
        });
        var em = new THREE.Mesh(cylGeo, emat);
        var edgeRec = {
          mesh: em,
          na: a, nb: b,
          ax: pa.x, ay: pa.y, az: pa.z,
          bx: pb.x, by: pb.y, bz: pb.z,
          path: onPathEdge
        };
        edgeMeshes.push(edgeRec);
        edgeByKey[(a < b ? a + "|" + b : b + "|" + a)] = edgeRec;
        group.add(em);
      }

      applyParams();
      applyTheme();
    }

    // ---------- apply params to existing meshes ----------
    function applyParams() {
      var i, o;
      var baseR = params.nodeSize * 0.9;

      for (i = 0; i < nodeMeshes.length; i++) {
        o = nodeMeshes[i];
        var r = baseR;
        if (o.hot) {
          // influencer enlargement scaled by relative degree
          var maxDeg = (graph && graph.maxDeg) ? graph.maxDeg : 1;
          if (maxDeg < 1) maxDeg = 1;
          r = baseR * (1 + params.influencer * (o.deg / maxDeg));
        }
        o.baseRadius = r;
        o.mesh.scale.set(r, r, r);

        var glow = params.glow;
        if (o.hot) {
          o.mesh.material.emissive.set(theme.nodeHot);
          o.mesh.material.emissiveIntensity = 0.55 * glow;
        } else if (o.path) {
          o.mesh.material.emissive.set(GREEN);
          o.mesh.material.emissiveIntensity = 0.45 * glow;
        } else {
          o.mesh.material.emissive.set(0x000000);
          o.mesh.material.emissiveIntensity = 0.0;
        }
        o.mesh.material.needsUpdate = true;
      }

      // Edges: radius
      for (i = 0; i < edgeMeshes.length; i++) {
        o = edgeMeshes[i];
        var rad = params.edgeWidth * 0.6;
        if (o.path) rad *= 2.2; // path edges thicker
        orientCylinder(o.mesh, o.ax, o.ay, o.az, o.bx, o.by, o.bz, rad);
      }

      // Labels: size + visibility, anchored slightly above node.
      // Perf: nur die höchstgradigen labelMax Knoten beschriften (Grad-Schwelle einmal bestimmen).
      var degCut = -1;
      if (isFinite(params.labelMax) && params.labelMax < labelSprites.length) {
        var degs = []; for (i = 0; i < labelSprites.length; i++) degs.push((labelSprites[i].node && labelSprites[i].node.deg) || 0);
        degs.sort(function (a, b) { return b - a; });
        degCut = degs[Math.max(0, Math.min(degs.length - 1, Math.floor(params.labelMax) - 1))];
      }
      for (i = 0; i < labelSprites.length; i++) {
        o = labelSprites[i];
        var lblOn = !!params.showLabels && (degCut < 0 || ((o.node && o.node.deg) || 0) >= degCut);
        o.sprite.visible = lblOn;
        var h = params.labelSize;          // world height
        var w = h * (o.aspect || 3);       // keep text aspect ratio
        o.sprite.scale.set(w, h, 1);
        // lift label above its node (direct reference, no index assumption)
        var nm = o.node;
        if (nm) {
          o.sprite.position.set(
            nm.mesh.position.x,
            nm.mesh.position.y + nm.baseRadius + h * 0.65,
            nm.mesh.position.z
          );
        }
      }

      // Fog density via fog factor (near/far tightened as fog increases).
      // Skaliert mit sceneR, damit der Nebel bei großer Spreizung nicht das ganze Netz schluckt.
      if (scene.fog) {
        var f = params.fog;
        if (f < 0.001) f = 0.001;
        var fr = sceneR > 200 ? sceneR : 200;
        scene.fog.near = fr * 3.5 / f;
        scene.fog.far = fr * 9.5 / f;
      }
    }

    // ---------- apply theme to scene + materials ----------
    function applyTheme() {
      scene.background = new THREE.Color(theme.bg);
      if (scene.fog) scene.fog.color.set(theme.fog);

      var i, o;
      for (i = 0; i < nodeMeshes.length; i++) {
        o = nodeMeshes[i];
        o.mesh.material.color.set(o.hot ? theme.nodeHot : theme.nodeBase);
        o.mesh.material.needsUpdate = true;
      }
      for (i = 0; i < edgeMeshes.length; i++) {
        o = edgeMeshes[i];
        o.mesh.material.color.set(o.path ? GREEN : theme.edge);
        o.mesh.material.needsUpdate = true;
      }
      // Re-render label textures in the theme's label color
      for (i = 0; i < labelSprites.length; i++) {
        o = labelSprites[i];
        var newTex = makeLabelTexture(o.name, theme.label);
        if (o.texture) o.texture.dispose();
        o.texture = newTex;
        o.aspect = newTex.aspect || o.aspect;
        o.material.map = newTex;
        o.material.needsUpdate = true;
      }
      // refresh emissive (depends on theme.nodeHot)
      applyParamsEmissiveOnly();
    }

    function applyParamsEmissiveOnly() {
      var i, o, glow = params.glow;
      for (i = 0; i < nodeMeshes.length; i++) {
        o = nodeMeshes[i];
        if (o.hot) {
          o.mesh.material.emissive.set(theme.nodeHot);
          o.mesh.material.emissiveIntensity = 0.55 * glow;
        } else if (o.path) {
          o.mesh.material.emissive.set(GREEN);
          o.mesh.material.emissiveIntensity = 0.45 * glow;
        }
      }
    }

    // ---------- API: setTheme ----------
    function setTheme(name) {
      theme = THEMES[name] || THEMES.dark;
      applyTheme();
    }

    // ---------- API: setParams ----------
    function setParams(S) {
      if (!S) return;
      var keys = ["nodeSize", "influencer", "labelSize", "edgeWidth",
                  "glow", "fog", "vignette"];
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (typeof S[k] === "number" && isFinite(S[k])) params[k] = S[k];
      }
      if (typeof S.showLabels === "boolean") params.showLabels = S.showLabels;
      if (typeof S.showShadow === "boolean") params.showShadow = S.showShadow;
      if (typeof S.labelMax === "number") params.labelMax = S.labelMax;
      applyParams();
    }
    // Perf-API: Label-Budget setzen (nur Label-Sichtbarkeit aktualisieren, ohne alles neu zu bauen)
    function setLabelBudget(n) {
      params.labelMax = (typeof n === "number") ? n : Infinity;
      refreshLabels();
    }
    function refreshLabels() {
      var degCut = -1;
      if (isFinite(params.labelMax) && params.labelMax < labelSprites.length) {
        var degs = []; for (var d = 0; d < labelSprites.length; d++) degs.push((labelSprites[d].node && labelSprites[d].node.deg) || 0);
        degs.sort(function (a, b) { return b - a; });
        degCut = degs[Math.max(0, Math.min(degs.length - 1, Math.floor(params.labelMax) - 1))];
      }
      for (var i = 0; i < labelSprites.length; i++) {
        var o = labelSprites[i];
        o.sprite.visible = !!params.showLabels && (degCut < 0 || ((o.node && o.node.deg) || 0) >= degCut);
      }
    }

    // ---------- size handling ----------
    var lastW = 0, lastH = 0, lastDPR = 0;
    function ensureSize() {
      var rect = canvas.getBoundingClientRect();
      var w = Math.max(1, Math.round(rect.width));
      var h = Math.max(1, Math.round(rect.height));
      var dpr = Math.min(window.devicePixelRatio || 1, quality.dprCap);
      if (w === lastW && h === lastH && dpr === lastDPR) return;
      lastW = w; lastH = h; lastDPR = dpr;
      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }

    function resize() {
      lastW = lastH = lastDPR = 0; // force recompute
      ensureSize();
    }

    // ---------- API: render(state) ----------
    function render(state) {
      ensureSize();
      state = state || {};

      // ---- Kino-Modus: Kamera frei im Welt-Raum (Layout-Koordinaten) ----
      if (state.camMode === "cinematic" && state.camPos && state.lookAt) {
        group.rotation.set(0, 0, 0);   // Gruppe ruhig stellen → Knoten = P[name]
        group.position.set(0, 0, 0);
        // FOV (Sichtfeld) dynamisch – kleiner = teleobjektiv/kinoiger, größer = weitwinklig.
        if (typeof state.fov === "number" && isFinite(state.fov) && Math.abs(camera.fov - state.fov) > 0.01) {
          camera.fov = Math.max(15, Math.min(95, state.fov));
          camera.updateProjectionMatrix();
        }
        // FIX BUG 1: Sicherheits-Klemme – die Kamera darf dem Blickpunkt nie näher als
        // state.minDist kommen, sonst füllt ein einzelner Knoten den ganzen Bildschirm.
        var cp = state.camPos, la = state.lookAt;
        var dx = cp.x - la.x, dy = cp.y - la.y, dz = cp.z - la.z;
        var dlen = Math.sqrt(dx * dx + dy * dy + dz * dz);
        var minD = (typeof state.minDist === "number" && state.minDist > 0) ? state.minDist : 0;
        if (minD > 0 && dlen < minD) {
          if (dlen < 1e-4) { dx = 0; dy = 0; dz = 1; dlen = 1; }  // entartet → entlang +Z
          var s = minD / dlen;
          camera.position.set(la.x + dx * s, la.y + dy * s, la.z + dz * s);
        } else {
          camera.position.set(cp.x, cp.y, cp.z);
        }
        // Banking: ein vom Aufrufer gelieferter up-Vektor erlaubt das Rollen in Kurven.
        var up = state.up;
        if (up && isFinite(up.x) && isFinite(up.y) && isFinite(up.z) && (up.x || up.y || up.z)) {
          camera.up.set(up.x, up.y, up.z);
        } else {
          camera.up.set(0, 1, 0);
        }
        camera.lookAt(la.x, la.y, la.z);
        renderer.render(scene, camera);
        return;
      }

      var rotX = state.rotX || 0;
      var rotY = state.rotY || 0;
      var zoom = state.zoom || 1;
      if (zoom <= 0.0001) zoom = 0.0001;
      var panX = state.panX || 0;
      var panY = state.panY || 0;
      var cam = state.cam || { x: 0, y: 0, z: 0 };

      // Group rotation
      group.rotation.x = rotX;
      group.rotation.y = rotY;

      // Pan: pixel offsets → world offset on the group (screen-relative-ish)
      // scale factor keeps panning intuitive across zoom levels
      var panScale = 1.0 / zoom;
      group.position.set(panX * panScale, -panY * panScale, 0);

      // Camera: look at origin from distance D, plus cam flight offset
      if (Math.abs(camera.fov - 50) > 0.01) { camera.fov = 50; camera.updateProjectionMatrix(); }  // FOV nach Kino zurücksetzen
      var D = 520 / zoom;
      camera.position.set(
        (cam.x || 0),
        (cam.y || 0),
        D + (cam.z || 0)
      );
      camera.up.set(0, 1, 0);
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    }

    // ---------- API: setQuality ----------
    // q: { sphereSeg, sphereSegH, cylSeg, dprCap } – Geometrie wird bei Bedarf neu gebaut
    function setQuality(q) {
      if (!q) return;
      var changedGeo = false;
      if (typeof q.sphereSeg === "number" && isFinite(q.sphereSeg)) { quality.sphereSeg = Math.max(4, Math.round(q.sphereSeg)); changedGeo = true; }
      if (typeof q.sphereSegH === "number" && isFinite(q.sphereSegH)) { quality.sphereSegH = Math.max(3, Math.round(q.sphereSegH)); changedGeo = true; }
      if (typeof q.cylSeg === "number" && isFinite(q.cylSeg)) { quality.cylSeg = Math.max(3, Math.round(q.cylSeg)); changedGeo = true; }
      if (changedGeo) {
        var oldS = sphereGeo, oldC = cylGeo;
        buildGeometries();
        for (var i = 0; i < nodeMeshes.length; i++) nodeMeshes[i].mesh.geometry = sphereGeo;
        for (i = 0; i < edgeMeshes.length; i++) edgeMeshes[i].mesh.geometry = cylGeo;
        if (oldS) oldS.dispose();
        if (oldC) oldC.dispose();
      }
      if (typeof q.dprCap === "number" && isFinite(q.dprCap)) { quality.dprCap = q.dprCap; resize(); }
    }

    // ---------- API: Laufzeit-Färbung (Ausbreitung) ----------
    function setNodeVisual(name, o) {
      var rec = nodeByName[name]; if (!rec || !o) return;
      var m = rec.mesh.material;
      if (o.color) m.color.set(o.color);
      if (o.emissive) m.emissive.set(o.emissive);
      if (typeof o.emissiveIntensity === "number") m.emissiveIntensity = o.emissiveIntensity;
      if (typeof o.scaleMul === "number") { var r = rec.baseRadius * o.scaleMul; rec.mesh.scale.set(r, r, r); }
    }
    function setEdgeVisual(key, o) {
      var rec = edgeByKey[key]; if (!rec || !o) return;
      var m = rec.mesh.material;
      if (o.color) m.color.set(o.color);
      if (o.emissive) m.emissive.set(o.emissive);
      if (typeof o.emissiveIntensity === "number") m.emissiveIntensity = o.emissiveIntensity;
    }
    // Progressives „Aufladen" einer Kante: vom Knoten fromName aus zu t∈[0..1] wachsen lassen.
    function setEdgeProgress(key, t, fromName, thick) {
      var rec = edgeByKey[key]; if (!rec) return;
      t = t < 0 ? 0 : (t > 1 ? 1 : t);
      var fromA = (fromName === rec.na);
      var sx, sy, sz, ex, ey, ez;
      if (fromA) { sx = rec.ax; sy = rec.ay; sz = rec.az; ex = rec.bx; ey = rec.by; ez = rec.bz; }
      else { sx = rec.bx; sy = rec.by; sz = rec.bz; ex = rec.ax; ey = rec.ay; ez = rec.az; }
      if (t <= 0.0015) { rec.mesh.visible = false; return; }
      rec.mesh.visible = true;
      var tx = sx + (ex - sx) * t, ty = sy + (ey - sy) * t, tz = sz + (ez - sz) * t;
      var rad = params.edgeWidth * 0.6 * (thick ? 2.4 : 1);
      orientCylinder(rec.mesh, sx, sy, sz, tx, ty, tz, rad);
    }
    function resetVisuals() {
      applyTheme();    // Knoten-/Kantenfarben + Emissive zurück auf Theme
      applyParams();   // Skalierung/Emissive-Stärke + volle Kanten-Orientierung
      for (var i = 0; i < edgeMeshes.length; i++) edgeMeshes[i].mesh.visible = true;
    }

    // ---------- API: pickNode (Raycast, für Klick-Auswahl & Hover) ----------
    // ndcX/ndcY: normalisierte Gerätekoordinaten (-1..1). Liefert Knotennamen oder null.
    var _ray = null;
    function pickNode(ndcX, ndcY) {
      if (!nodeMeshes.length) return null;
      if (!_ray) _ray = new THREE.Raycaster();
      group.updateMatrixWorld(true);                 // Welt-Matrizen aktuell halten
      _ray.setFromCamera({ x: ndcX, y: ndcY }, camera);
      var list = [];
      for (var i = 0; i < nodeMeshes.length; i++) { nodeMeshes[i].mesh.userData._n = nodeMeshes[i].name; list.push(nodeMeshes[i].mesh); }
      var hits = _ray.intersectObjects(list, false);
      return hits.length ? hits[0].object.userData._n : null;
    }

    // ---------- API: dispose ----------
    function dispose() {
      clearBuilt();
      if (sphereGeo) sphereGeo.dispose();
      if (cylGeo) cylGeo.dispose();
      scene.remove(group);
      scene.remove(ambient);
      scene.remove(dirA);
      scene.remove(dirB);
      if (renderer) renderer.dispose();
    }

    // ---------- public api ----------
    var api = {
      setGraph: setGraph,
      setTheme: setTheme,
      setParams: setParams,
      setQuality: setQuality,
      setLabelBudget: setLabelBudget,
      setNodeVisual: setNodeVisual,
      setEdgeVisual: setEdgeVisual,
      setEdgeProgress: setEdgeProgress,
      resetVisuals: resetVisuals,
      pickNode: pickNode,
      render: render,
      resize: resize,
      dispose: dispose
    };

    // initial sizing + theme
    ensureSize();
    applyTheme();

    return api;
  }

  window.THREE_NET = { create: create };
})();
