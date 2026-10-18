# Graph Report - NarradorCoop  (2026-10-18)

## Corpus Check
- 99 files · ~291,664 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 22 file(s) not represented in the graph (top: .X 19, (none) 1, .jar 1)

## Summary
- 1129 nodes · 3495 edges · 47 communities (37 shown, 10 thin omitted)
- Extraction: 65% EXTRACTED · 35% INFERRED · 0% AMBIGUOUS · INFERRED: 1231 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `125348bc`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- NarradorDirector.lua
- NarradorGenerador.lua
- NarradorMundo.lua
- NarradorConversacion.lua
- NarradorCuraServer.lua
- NarradorDiario.lua
- NarradorContactos.lua
- Mundo.jugadores
- NarradorConversas.lua
- NarradorDominios.lua
- NarradorCliente.lua
- Bandido.lua
- NarradorIndicadores.lua
- NarradorDefs.lua
- NarradorIndicadoresCalc.lua
- NarradorMotor.lua
- NarradorOcupaciones.lua
- NarradorLore.lua
- Ind.menu
- Mundo.posicion
- NarradorEncuentros.lua
- Generados.lua
- NarradorSousBase.lua
- Inmorales.lua
- Contratos.lua
- Sous.lua
- NarradorObjetos.lua
- NarradorBell.lua
- NarradorPasajeros.lua
- Motor.estado
- NarradorViewpoint
- Mundo.posicionActor
- NarradorMundoALife.lua
- NarradorMotorGrupos.lua
- Mundo.azar
- Mundo.horas
- NarradorConversacionServer.lua
- Motor.diferir
- HistoriasSous2.lua
- Motor.cumple
- HistoriasSous1.lua
- NarradorRepararCliente.lua
- NarradorVenganzaMeulen.lua

## God Nodes (most connected - your core abstractions)
1. `Motor.estado()` - 138 edges
2. `Mundo.horas()` - 106 edges
3. `Mundo.azar()` - 72 edges
4. `Mundo.log()` - 62 edges
5. `Mundo.jugadores()` - 47 edges
6. `Motor.enviar()` - 44 edges
7. `Mundo.grupoDe()` - 40 edges
8. `Motor.publicar()` - 39 edges
9. `Mundo.jugadorCerca()` - 37 edges
10. `C.estado()` - 36 edges

## Surprising Connections (you probably didn't know these)
- `BA.tick()` --calls--> `Mundo.hayALife()`  [INFERRED]
  42/media/lua/server/Narrador/NarradorBandido.lua → 42/media/lua/server/Narrador/NarradorMundoALife.lua
- `Cal.corteLuz()` --calls--> `Mundo.hayLuz()`  [INFERRED]
  42/media/lua/server/Narrador/NarradorCalendario.lua → 42/media/lua/server/Narrador/NarradorMundo.lua
- `CO.estanque()` --calls--> `Mundo.llenarBencina()`  [INFERRED]
  42/media/lua/server/Narrador/NarradorConsecuencias.lua → 42/media/lua/server/Narrador/NarradorMundo.lua
- `C.enterrar()` --calls--> `Mundo.quitarCadaver()`  [INFERRED]
  42/media/lua/server/Narrador/NarradorContactos.lua → 42/media/lua/server/Narrador/NarradorMundo.lua
- `S.residentesInfo()` --calls--> `Motor.estado()`  [INFERRED]
  42/media/lua/server/Narrador/NarradorConversacionServer.lua → 42/media/lua/server/Narrador/NarradorMotor.lua

## Import Cycles
- None detected.

## Communities (47 total, 10 thin omitted)

### Community 0 - "NarradorDirector.lua"
Cohesion: 0.16
Nodes (27): Director.abrirPendientes(), Director.alIniciar(), Director.anotar(), Director.bajarTension(), Director.candidatos(), Director.contarRumores(), Director.elegible(), Director.estadoTexto() (+19 more)

### Community 1 - "NarradorGenerador.lua"
Cohesion: 0.10
Nodes (64): S.nivelConfianza(), C.decir(), C.def(), C.elegirEncargo(), C.encargoDelGrupo(), C.extra(), C.extraParaEncargo(), C.lugar() (+56 more)

### Community 2 - "NarradorMundo.lua"
Cohesion: 0.05
Nodes (56): S.comprar(), S.forjar(), C.armaKit(), contarTipos(), H.crearArma(), H.crearArmas(), H.tick(), H.crearArma() (+48 more)

### Community 3 - "NarradorConversacion.lua"
Cohesion: 0.06
Nodes (72): Cliente.enviar(), ahora(), arcoPorId(), Conv.abrir(), Conv.abrirMisiones(), Conv.alCambiarResolucion(), Conv.altoFuente(), Conv.cambiarSeguir() (+64 more)

### Community 4 - "NarradorCuraServer.lua"
Cohesion: 0.15
Nodes (14): Cura.examinar(), Cura.menuInventario(), nivelMedicina(), CS.falta(), CS.repasoCura(), CS.st(), CS.vista(), Cura.curar() (+6 more)

### Community 5 - "NarradorDiario.lua"
Cohesion: 0.08
Nodes (48): agregar(), cerrada(), cerradas(), dentro(), Diario.abrir(), Diario.acomodarIcono(), Diario.alCambiarResolucion(), Diario.alternar() (+40 more)

### Community 6 - "NarradorContactos.lua"
Cohesion: 0.06
Nodes (68): avisarTodos(), banderasGuardia(), esCaja(), esMunicion(), esRopaSuelta(), mejorar(), porValor(), S.aparecer() (+60 more)

### Community 7 - "Mundo.jugadores"
Cohesion: 0.06
Nodes (74): jugadoresDe(), BA.consecuenciaUltimo(), BA.enCurso(), BA.jefe(), BA.jefeCorto(), BA.lanzar(), BA.revisar(), BA.revisarConquista() (+66 more)

### Community 8 - "NarradorConversas.lua"
Cohesion: 0.12
Nodes (29): calza(), claveZona(), CS.activaCerca(), CS.avanzar(), CS.charlaPausada(), CS.duracion(), CS.elegible(), CS.empezar() (+21 more)

### Community 9 - "NarradorDominios.lua"
Cohesion: 0.09
Nodes (30): KC.despreciado(), KC.menu(), KC.menuCatalogo(), KC.miConfianza(), KC.textoReservas(), CA.anotar(), CA.anotarContacto(), CA.revisar() (+22 more)

### Community 10 - "NarradorCliente.lua"
Cohesion: 0.09
Nodes (24): Cliente.abrirDiario(), Cliente.abrirRegistro(), Cliente.alIniciar(), Cliente.cuerpoDe(), Cliente.engancharMapa(), Cliente.esAdmin(), Cliente.menu(), Cliente.miEncargo() (+16 more)

### Community 11 - "Bandido.lua"
Cohesion: 0.14
Nodes (6): C.tonoKnox(), finalRedimido(), J(), llegarAlPatio(), pereiraEnPatio(), KD.tono()

### Community 12 - "NarradorIndicadores.lua"
Cohesion: 0.12
Nodes (18): Ind.actualizarPaneles(), Ind.alTick(), Ind.buscarApiVP(), Ind.crear(), Ind.diagnostico(), Ind.hayViewpoint(), Ind.leer(), Ind.mirada() (+10 more)

### Community 14 - "NarradorIndicadoresCalc.lua"
Cohesion: 0.24
Nodes (14): Ind.aPantalla(), NarradorBrujula:render(), NarradorFlecha:actualizar(), NarradorFlecha:render(), IC.alBorde(), IC.anguloIso(), IC.color(), IC.distancia() (+6 more)

### Community 15 - "NarradorMotor.lua"
Cohesion: 0.12
Nodes (24): C.encargosActivos(), C.revisarMall(), EV.tick(), hayContadorDeBajas(), Motor.anotar(), Motor.avisarContador(), Motor.contarBajas(), Motor.decir() (+16 more)

### Community 16 - "NarradorOcupaciones.lua"
Cohesion: 0.08
Nodes (37): apiSimbolos(), datosDe(), fuenteTexto(), imagenEncima(), M.enganchar(), M.engancharISMap(), M.iniciarMapa(), M.menu() (+29 more)

### Community 18 - "NarradorLore.lua"
Cohesion: 0.18
Nodes (6): Motor.loreTexto(), Motor.vistaLore(), Lore.de(), Lore.etapa(), Lore.final(), Lore.intro()

### Community 19 - "Ind.menu"
Cohesion: 0.21
Nodes (13): Cliente.actualizarNpcs(), Cliente.alComandoServidor(), Cliente.avisarPreguntas(), Cliente.cartel(), Cliente.decir(), Cliente.halo(), Cliente.marcar(), Cliente.ponerMarcas() (+5 more)

### Community 20 - "Mundo.posicion"
Cohesion: 0.21
Nodes (19): A.activas(), A.agrupar(), A.direccionTexto(), A.elegirTipo(), A.intervalo(), A.lanzar(), A.presupuesto(), A.programar() (+11 more)

### Community 21 - "NarradorEncuentros.lua"
Cohesion: 0.25
Nodes (12): E.activo(), E.direccion(), E.elegirTipo(), E.estado(), E.lanzar(), E.misioneroCercano(), E.nivelSandbox(), E.revisarJugador() (+4 more)

### Community 22 - "Generados.lua"
Cohesion: 0.42
Nodes (9): base(), buscar(), complicaciones(), enSitio(), entregarAlMisionero(), finales(), inicio(), plazo() (+1 more)

### Community 23 - "NarradorSousBase.lua"
Cohesion: 0.11
Nodes (36): MQ.buscar(), MQ.casillaJunto(), MQ.poner(), MQ.revisar(), casillaLibre(), Mundo.cargado(), adentro(), alturaMesa() (+28 more)

### Community 24 - "Inmorales.lua"
Cohesion: 0.43
Nodes (5): finales(), plazo(), registrarInmoral(), viaje(), volver()

### Community 25 - "Contratos.lua"
Cohesion: 0.73
Nodes (5): comunes(), encargoAlijo(), encargoBuscar(), encargoRescate(), salidasDePlazo()

### Community 26 - "Sous.lua"
Cohesion: 0.28
Nodes (3): esconditeComun(), etapasEscuadras(), perfilesDe()

### Community 27 - "NarradorObjetos.lua"
Cohesion: 0.60
Nodes (3): anteponer(), O.ajustarArcos(), recorrerAcciones()

### Community 28 - "NarradorBell.lua"
Cohesion: 0.18
Nodes (19): avisarCerca(), avisarTodos(), B.alVolver(), B.aparecer(), B.huir(), B.limpiarCasa(), B.peligro(), B.rondar() (+11 more)

### Community 32 - "NarradorPasajeros.lua"
Cohesion: 0.14
Nodes (28): ED.aparecer(), ED.corresponde(), ED.enHistoria(), ED.sigueme(), ED.st(), ED.tick(), ED.vuelve(), Motor.copiar() (+20 more)

### Community 33 - "Motor.estado"
Cohesion: 0.18
Nodes (24): B.migrar(), C.revisarDesbloqueo(), C.revisarRegresos(), EV.puede(), EV.revisar(), H.disponible(), H.ocupado(), H.revisar() (+16 more)

### Community 35 - "Mundo.posicionActor"
Cohesion: 0.28
Nodes (12): S.hablar(), Motor.vacia(), Motor.zonaSegura(), lineasDe(), Motor.charlaElegir(), Motor.charlar(), Motor.decirUid(), Motor.hacerResidentes() (+4 more)

### Community 36 - "NarradorMundoALife.lua"
Cohesion: 0.24
Nodes (12): C.aparecer(), G.revisarVecinos(), mismasBanderas(), Mundo.arreglarCarnet(), Mundo.banderas(), Mundo.claveALife(), Mundo.hayALife(), Mundo.instalarNombres() (+4 more)

### Community 37 - "NarradorMotorGrupos.lua"
Cohesion: 0.17
Nodes (19): Motor.avisar(), Motor.valor(), Motor.acompanarGrupo(), Motor.banderasDe(), Motor.banderasGrupo(), Motor.completarGrupo(), Motor.corregirNombres(), Motor.filtrarPerfiles() (+11 more)

### Community 38 - "Mundo.azar"
Cohesion: 0.39
Nodes (8): Motor.cantidad(), Motor.sortear(), Motor.zonaDe(), Mundo.azar(), casillaAfuera(), O.decorar(), O.grafitear(), O.ocupar()

### Community 39 - "Mundo.horas"
Cohesion: 0.19
Nodes (22): anotar(), S.empezarAtaque(), S.revisarAtaque(), CO.estanque(), C.alMorir(), C.enterrar(), C.inmuneMurio(), C.reponer() (+14 more)

### Community 40 - "NarradorConversacionServer.lua"
Cohesion: 0.31
Nodes (9): listasDe(), S.alComando(), S.completarArco(), S.elegirLinea(), S.frase(), S.nombreDe(), S.residentesInfo(), S.rolDeOpcion() (+1 more)

### Community 41 - "Motor.diferir"
Cohesion: 0.48
Nodes (6): Motor.copiarPlano(), Motor.diferir(), Motor.ejecutar(), Motor.resolverVars(), Motor.transformar(), Mundo.zombiEn()

### Community 43 - "Motor.cumple"
Cohesion: 0.33
Nodes (6): Motor.opcionVisible(), Motor.revisarSalidas(), Motor.cumple(), Motor.onNpcMuerto(), Mundo.esJugador(), Mundo.asesinoALife()

## Knowledge Gaps
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Motor.estado()` connect `Motor.estado` to `NarradorDirector.lua`, `NarradorGenerador.lua`, `NarradorMundo.lua`, `NarradorCuraServer.lua`, `NarradorContactos.lua`, `Mundo.jugadores`, `NarradorConversas.lua`, `NarradorDominios.lua`, `NarradorMotor.lua`, `NarradorOcupaciones.lua`, `Mundo.posicion`, `NarradorEncuentros.lua`, `NarradorSousBase.lua`, `NarradorBell.lua`, `NarradorPasajeros.lua`, `Mundo.posicionActor`, `NarradorMundoALife.lua`, `NarradorMotorGrupos.lua`, `Mundo.horas`, `NarradorConversacionServer.lua`, `Motor.diferir`, `Motor.cumple`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **Why does `Defs.get()` connect `NarradorMotor.lua` to `Motor.estado`, `NarradorGenerador.lua`, `Mundo.posicionActor`, `Mundo.jugadores`, `NarradorConversacionServer.lua`, `Mundo.horas`, `Motor.cumple`, `NarradorDefs.lua`, `NarradorEncuentros.lua`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **Why does `Mundo.horas()` connect `Mundo.horas` to `NarradorDirector.lua`, `NarradorGenerador.lua`, `NarradorMundo.lua`, `NarradorCuraServer.lua`, `NarradorContactos.lua`, `Mundo.jugadores`, `NarradorConversas.lua`, `NarradorDominios.lua`, `NarradorMotor.lua`, `NarradorOcupaciones.lua`, `Mundo.posicion`, `NarradorEncuentros.lua`, `NarradorSousBase.lua`, `NarradorBell.lua`, `NarradorPasajeros.lua`, `Motor.estado`, `Mundo.posicionActor`, `NarradorMundoALife.lua`, `NarradorMotorGrupos.lua`, `Mundo.azar`, `Motor.diferir`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Are the 119 inferred relationships involving `Motor.estado()` (e.g. with `A.programar()` and `A.st()`) actually correct?**
  _`Motor.estado()` has 119 INFERRED edges - model-reasoned connections that need verification._
- **Are the 105 inferred relationships involving `Mundo.horas()` (e.g. with `A.elegirTipo()` and `A.lanzar()`) actually correct?**
  _`Mundo.horas()` has 105 INFERRED edges - model-reasoned connections that need verification._
- **Are the 62 inferred relationships involving `Mundo.azar()` (e.g. with `A.elegirTipo()` and `A.intervalo()`) actually correct?**
  _`Mundo.azar()` has 62 INFERRED edges - model-reasoned connections that need verification._
- **Are the 60 inferred relationships involving `Mundo.log()` (e.g. with `A.lanzar()` and `BA.consecuenciaUltimo()`) actually correct?**
  _`Mundo.log()` has 60 INFERRED edges - model-reasoned connections that need verification._