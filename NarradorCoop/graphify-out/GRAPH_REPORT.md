# Graph Report - NarradorCoop  (2026-10-16)

## Corpus Check
- 73 files · ~244,682 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 19 file(s) not represented in the graph (top: .X 18, .info 1)

## Summary
- 936 nodes · 2884 edges · 29 communities (27 shown, 2 thin omitted)
- Extraction: 68% EXTRACTED · 32% INFERRED · 0% AMBIGUOUS · INFERRED: 923 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4c7024d7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Mundo.horas
- NarradorContactos.lua
- NarradorMotor.lua
- NarradorConversacion.lua
- NarradorMundo.lua
- NarradorDiario.lua
- NarradorCampamentos.lua
- NarradorKnox.lua
- NarradorConversas.lua
- NarradorDominios.lua
- NarradorCliente.lua
- Ideas futuras: campamentos de supervivientes
- NarradorIndicadores.lua
- NarradorDefs.lua
- NarradorIndicadoresCalc.lua
- NarradorPasajeros.lua
- NarradorOcupaciones.lua
- NarradorHuellas.lua
- NarradorLore.lua
- Ind.menu
- NarradorMapas.lua
- NarradorLegendario.lua
- Generados.lua
- S.pedirFavor
- NarradorObjetosServer.lua
- Contratos.lua
- Sous.lua
- NarradorObjetos.lua
- README.md

## God Nodes (most connected - your core abstractions)
1. `Motor.estado()` - 94 edges
2. `Mundo.horas()` - 91 edges
3. `Mundo.azar()` - 64 edges
4. `Mundo.jugadores()` - 41 edges
5. `Mundo.log()` - 40 edges
6. `Motor.enviar()` - 38 edges
7. `Mundo.grupoDe()` - 36 edges
8. `Mundo.posicion()` - 34 edges
9. `Motor.iniciar()` - 33 edges
10. `C.estado()` - 32 edges

## Surprising Connections (you probably didn't know these)
- `S.enAtaque()` --calls--> `C.estado()`  [INFERRED]
  42/media/lua/server/Narrador/NarradorCampamentos.lua → 42/media/lua/server/Narrador/NarradorContactos.lua
- `S.comprar()` --calls--> `L.crearAuto()`  [INFERRED]
  42/media/lua/server/Narrador/NarradorCampamentos.lua → 42/media/lua/shared/Narrador/NarradorLegendario.lua
- `C.tonoKnox()` --calls--> `KD.tono()`  [INFERRED]
  42/media/lua/server/Narrador/NarradorContactos.lua → 42/media/lua/shared/Narrador/NarradorKnoxDefs.lua
- `S.alComando()` --calls--> `Mundo.log()`  [INFERRED]
  42/media/lua/server/Narrador/NarradorConversacionServer.lua → 42/media/lua/server/Narrador/NarradorMundo.lua
- `CS.repasoCura()` --calls--> `Cura.infectado()`  [INFERRED]
  42/media/lua/server/Narrador/NarradorCuraServer.lua → 42/media/lua/shared/Narrador/NarradorCura.lua

## Import Cycles
- None detected.

## Communities (29 total, 2 thin omitted)

### Community 0 - "Mundo.horas"
Cohesion: 0.05
Nodes (109): A.activas(), A.agrupar(), A.direccionTexto(), A.elegirTipo(), A.intervalo(), A.lanzar(), A.presupuesto(), A.programar() (+101 more)

### Community 1 - "NarradorContactos.lua"
Cohesion: 0.07
Nodes (91): Cal.ultimaNoche(), S.nivelConfianza(), C.anotarPuertas(), C.cajaEdificio(), C.cuerpoMuerto(), C.curarPuertas(), C.darMapa(), C.decir() (+83 more)

### Community 2 - "NarradorMotor.lua"
Cohesion: 0.06
Nodes (89): C.encargosActivos(), C.limpiar(), C.revisarMall(), C.zonaSegura(), listasDe(), S.alComando(), S.completarArco(), S.elegirLinea() (+81 more)

### Community 3 - "NarradorConversacion.lua"
Cohesion: 0.07
Nodes (68): Cliente.enviar(), ahora(), arcoPorId(), Conv.abrir(), Conv.abrirMisiones(), Conv.alCambiarResolucion(), Conv.altoFuente(), Conv.cambiarSeguir() (+60 more)

### Community 4 - "NarradorMundo.lua"
Cohesion: 0.06
Nodes (56): Cal.amigoSecreto(), Cal.calor(), Cal.corteLuz(), Cal.dulces(), Cal.eventosActivos(), Cal.fonda(), Cal.niebla(), Cal.residente() (+48 more)

### Community 5 - "NarradorDiario.lua"
Cohesion: 0.08
Nodes (46): agregar(), cerrada(), cerradas(), dentro(), Diario.abrir(), Diario.acomodarIcono(), Diario.alCambiarResolucion(), Diario.alternar() (+38 more)

### Community 6 - "NarradorCampamentos.lua"
Cohesion: 0.09
Nodes (46): KC.despreciado(), KC.menu(), KC.menuCatalogo(), KC.miConfianza(), KC.textoReservas(), anotar(), avisarTodos(), banderasGuardia() (+38 more)

### Community 7 - "NarradorKnox.lua"
Cohesion: 0.08
Nodes (23): anotar(), avisarGrupo(), KX.alMorirNpc(), KX.bandidosLimpios(), KX.despreciado(), KX.despreciadoJugador(), KX.esHostil(), KX.nivelDe() (+15 more)

### Community 8 - "NarradorConversas.lua"
Cohesion: 0.13
Nodes (29): calza(), claveZona(), CS.activaCerca(), CS.avanzar(), CS.charlaPausada(), CS.duracion(), CS.elegible(), CS.empezar() (+21 more)

### Community 9 - "NarradorDominios.lua"
Cohesion: 0.10
Nodes (26): Cura.examinar(), Cura.menuInventario(), nivelMedicina(), CS.falta(), CS.st(), CS.vista(), C.alMorir(), C.revisarRegresos() (+18 more)

### Community 10 - "NarradorCliente.lua"
Cohesion: 0.09
Nodes (24): Cliente.abrirDiario(), Cliente.abrirRegistro(), Cliente.alIniciar(), Cliente.cuerpoDe(), Cliente.engancharMapa(), Cliente.esAdmin(), Cliente.menu(), Cliente.miEncargo() (+16 more)

### Community 11 - "Ideas futuras: campamentos de supervivientes"
Cohesion: 0.06
Nodes (31): A. Eventos fortuitos de Eduardo (después de conocerlo), A. Eventos fortuitos de Eduardo (hecho, falta probar en el juego), B. El camino del bandido (Knox negativo), Brújula sigue a la cámara (hecho, falta probar en el juego), C. Modo historia de los misioneros (hecho, falta probar en el juego), Campamentos con niveles y comerciantes (hecho, falta probar), Diario en lápiz pasta azul (hecho, falta probar en el juego), Encuentros: llevar a la persona al campamento (hecho, falta probar) (+23 more)

### Community 12 - "NarradorIndicadores.lua"
Cohesion: 0.15
Nodes (15): Ind.actualizarPaneles(), Ind.alTick(), Ind.buscarApiVP(), Ind.crear(), Ind.diagnostico(), Ind.hayViewpoint(), Ind.leer(), Ind.mirada() (+7 more)

### Community 14 - "NarradorIndicadoresCalc.lua"
Cohesion: 0.22
Nodes (15): Ind.aPantalla(), Ind.textura(), NarradorBrujula:render(), NarradorFlecha:actualizar(), NarradorFlecha:render(), IC.alBorde(), IC.anguloIso(), IC.color() (+7 more)

### Community 15 - "NarradorPasajeros.lua"
Cohesion: 0.28
Nodes (14): Mundo.actorVivo(), alLado(), enAuto(), jugadorPorNombre(), P.agregar(), P.bajar(), P.esAcompanante(), P.lista() (+6 more)

### Community 16 - "NarradorOcupaciones.lua"
Cohesion: 0.30
Nodes (14): clave(), O.activo(), O.clasificar(), O.contar(), O.darBotin(), O.deMisionero(), O.estadoTexto(), O.listoParaOcupar() (+6 more)

### Community 17 - "NarradorHuellas.lua"
Cohesion: 0.30
Nodes (13): H.alTerminar(), H.anunciarTitulo(), H.completarHuella(), H.estadoTexto(), H.fama(), H.gruposDe(), H.registrar(), H.st() (+5 more)

### Community 18 - "NarradorLore.lua"
Cohesion: 0.20
Nodes (5): Motor.vistaLore(), Lore.de(), Lore.etapa(), Lore.final(), Lore.intro()

### Community 19 - "Ind.menu"
Cohesion: 0.21
Nodes (13): Cliente.actualizarNpcs(), Cliente.alComandoServidor(), Cliente.avisarPreguntas(), Cliente.cartel(), Cliente.decir(), Cliente.halo(), Cliente.marcar(), Cliente.ponerMarcas() (+5 more)

### Community 20 - "NarradorMapas.lua"
Cohesion: 0.26
Nodes (9): apiSimbolos(), datosDe(), imagenEncima(), M.enganchar(), M.engancharISMap(), M.iniciarMapa(), M.menu(), M.pedirFavor() (+1 more)

### Community 21 - "NarradorLegendario.lua"
Cohesion: 0.33
Nodes (9): azar(), crearItem(), es(), L.alEquipar(), L.aplicar(), L.crear(), L.crearAuto(), L.marcar() (+1 more)

### Community 22 - "Generados.lua"
Cohesion: 0.42
Nodes (9): base(), buscar(), complicaciones(), enSitio(), entregarAlMisionero(), finales(), inicio(), plazo() (+1 more)

### Community 23 - "S.pedirFavor"
Cohesion: 0.42
Nodes (8): S.alComando(), S.favoresDisponibles(), S.pedirFavor(), F.def(), F.disponible(), F.idDe(), F.residente(), registrarFavor()

### Community 24 - "NarradorObjetosServer.lua"
Cohesion: 0.43
Nodes (5): Mundo.crearMapa(), Mundo.crearMapaZona(), S.casillaConPared(), S.crearMapa(), S.zona()

### Community 25 - "Contratos.lua"
Cohesion: 0.73
Nodes (5): comunes(), encargoAlijo(), encargoBuscar(), encargoRescate(), salidasDePlazo()

### Community 26 - "Sous.lua"
Cohesion: 0.47
Nodes (3): esconditeComun(), etapasEscuadras(), perfilesDe()

### Community 27 - "NarradorObjetos.lua"
Cohesion: 0.60
Nodes (3): anteponer(), O.ajustarArcos(), recorrerAcciones()

## Knowledge Gaps
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Motor.estado()` connect `NarradorMotor.lua` to `Mundo.horas`, `NarradorContactos.lua`, `NarradorMundo.lua`, `NarradorCampamentos.lua`, `NarradorKnox.lua`, `NarradorConversas.lua`, `NarradorDominios.lua`, `NarradorPasajeros.lua`, `NarradorOcupaciones.lua`, `NarradorHuellas.lua`, `S.pedirFavor`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Are the 70 inferred relationships involving `Motor.estado()` (e.g. with `A.st()` and `BA.jefe()`) actually correct?**
  _`Motor.estado()` has 70 INFERRED edges - model-reasoned connections that need verification._
- **Should `Mundo.horas` be split into smaller, more focused modules?**
  _Cohesion score 0.052100840336134456 - nodes in this community are weakly interconnected._
- **Why does `Mundo.horas()` connect `Mundo.horas` to `NarradorContactos.lua`, `NarradorMotor.lua`, `NarradorMundo.lua`, `NarradorCampamentos.lua`, `NarradorKnox.lua`, `NarradorConversas.lua`, `NarradorDominios.lua`, `NarradorOcupaciones.lua`, `NarradorHuellas.lua`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Are the 89 inferred relationships involving `Mundo.horas()` (e.g. with `A.elegirTipo()` and `A.lanzar()`) actually correct?**
  _`Mundo.horas()` has 89 INFERRED edges - model-reasoned connections that need verification._
- **Should `NarradorContactos.lua` be split into smaller, more focused modules?**
  _Cohesion score 0.06774668630338733 - nodes in this community are weakly interconnected._
- **Why does `S.comprar()` connect `NarradorCampamentos.lua` to `Mundo.horas`, `NarradorContactos.lua`, `NarradorMotor.lua`, `NarradorMundo.lua`, `NarradorKnox.lua`, `NarradorLegendario.lua`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._