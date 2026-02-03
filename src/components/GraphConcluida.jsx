import { useEffect, useRef, useState } from "react";
import cytoscape from "cytoscape";
import "../App.css";
import { useCurriculo } from "../context/useDataContext";
import ModalSubjects from "./ModalSubjects";

export default function GraphConcluida() {
  const { history, curriculo } = useCurriculo();

  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [subjectCompleted, setSubjectCompleted] = useState([]);

  const [pendent, setPendant] = useState([]);

  const [showSubjectCompleted, setShowSubjectCompleted] = useState(false);
  const [showSubjectPendant, setShowSubjecPendant] = useState(false);

  function onCloseModal() {
    setModalAberto(false);
    console.log("cliquei", modalAberto);
  }
  function setShowFilterCompleted() {
    setShowSubjectCompleted(!showSubjectCompleted);
  }

  function setShowFilterPendant() {
    setShowSubjecPendant(!showSubjectPendant);
    console.log("cliquei");
  }

  const cyRef = useRef(null);

  useEffect(() => {
    let cy;

    async function inicializarGrafo() {
      try {
        // const resp = await fetch("/matriz.json");
        // if (!resp.ok) throw new Error("Erro ao carregar matriz.json");

        // const elementos = await resp.json();
        const elementos = curriculo;

        const mapeiaHistorico = new Set(
          history.map((d) => d.codigo.trim().toUpperCase())
        );
        console.log("curricuko", curriculo.disciplina);

        const curriculoComStatus = elementos.map((disc) => ({
          ...disc,
          concluida: mapeiaHistorico.has(disc.codigo.trim().toUpperCase()),
        }));

        console.log("mapeia hisoricoo", mapeiaHistorico);

        const nodes = curriculoComStatus.map((disc) => ({
          data: {
            id: disc.codigo,
            nome: disc.nome,
            periodo: disc.periodo,
            carga: disc.carga_horaria,
            concluida: disc.concluida,
            oldLabel: disc.codigo,
          },
          classes: disc.concluida ? "concluida" : "",
        }));
        /************** filter completed***************/
        const filterSubjectCompleted = curriculoComStatus.filter(
          (f) => f.concluida
        );
        console.log(
          "MEU FILTRO DE MATERIAaaaaaaaaaaaaaaaaaaaaS ",
          filterSubjectCompleted
        );
        setSubjectCompleted(filterSubjectCompleted);
        /************** filter completed***************/

        /************** filter pendant***************/
        const filterSubjectPendant = curriculoComStatus.filter(
          (f) => f.concluida === false
        );
        setPendant(filterSubjectPendant);
        console.log("nodes mapeados com concluido", nodes);
        const edges = [];
        elementos.forEach((element) => {
          element.pre_requisitos.forEach((pr) => {
            edges.push({
              data: {
                id: `${pr}->${element.codigo}`,
                source: pr,
                target: element.codigo,
              },
            });
          });
        });
        console.log("edges", edges);
        cy = cytoscape({
          container: cyRef.current,
          elements: [...nodes, ...edges],
          autoungrabify: false,
          userPanningEnabled: false,
          userZoomingEnabled: false,
          style: [
            {
              selector: "node",
              style: {
                label: "data(id)",
                "background-color": "black",
                color: "#fff",
                "text-valign": "center",
                width: 200,
                height: 30,
                "font-size": "15px",
                shape: "round-rectangle",
              },
            },
            {
              selector: "node.concluida",
              style: {
                "background-color": "#2ECC40", // VERDE
                color: "#000",
                "font-weight": "bold",
              },
            },
            {
              selector: "edge",
              style: {
                "curve-style": "bezier",
                "target-arrow-shape": "triangle",
              },
            },
            { selector: "node.faded", style: { opacity: 0.3 } },
            { selector: "edge.faded", style: { opacity: 0.1 } },
            {
              selector: "node.highlighted",
              style: {
                label: "data(id)",
                "text-valign": "center",
                width: 200,
                height: 50,
                "font-size": "15px",
                shape: "round-rectangle",
                "background-color": "#FF851B", // Cor de destaque
                "line-color": "#FF851B",
                opacity: 0.8,
              },
            },
            {
              selector: "edge.highlighted",
              style: {
                "curve-style": "bezier",
                "target-arrow-shape": "triangle",
                width: 4,
                "background-color": "#FF851B", // Cor de destaque
                "line-color": "#FF855F",
                "target-arrow-color": "#FF855F",
                "z-index": "50",
              },
            },
          ],
        });

        const contagemDeLinhas = {};

        cy.layout({
          name: "preset",
          positions: (node) => {
            const p = node.data("periodo");
            if (contagemDeLinhas[p] === undefined) contagemDeLinhas[p] = 0;
            const linha = contagemDeLinhas[p]++;
            return {
              x: p * 230,
              y: linha * 40,
            };
          },
        }).run();

        cy.on("mouseover", "node", (evt) => {
          const node = evt.target;

          // Mostrar o nome da matéria
          node.data("oldLabel", node.data("id")); // guarda id antigo
          node.data("label", node.data("nome")); // coloca nome
          node.style("label", node.data("label")); // atualiza visual

          // efeito fade nos outros nós
          const connected = node
            .successors()
            .union(node.predecessors())
            .union(node);
          cy.elements().difference(connected).addClass("faded");
          connected.removeClass("faded").addClass("highlighted");
        });

        cy.on("mouseout", "node", (evt) => {
          const node = evt.target;

          // volta ao id original
          node.data("label", node.data("oldLabel"));
          node.style("label", node.data("label"));

          cy.elements().removeClass("faded highlighted");
        });

        cy.on("tap", "node", (evt) => {
          const node = evt.target;

          setDisciplinaSelecionada({
            codigo: node.data("id"),
            nome: node.data("nome"),
            periodo: node.data("periodo"),
            carga: node.data("carga"),
            concluida: node.data("concluida"),
          });

          setModalAberto(true);
        });
      } catch (e) {
        console.error(e);
        if (cyRef.current) {
          cyRef.current.innerText =
            "Erro ao carregar o grafo. Verifique o console.";
        }
      }
    }

    inicializarGrafo();

    return () => {
      if (cy) cy.destroy();
    };
  }, [curriculo, history]);

  return (
    <div className="flex flex-col gap-10">
      <div id="cy" ref={cyRef} />
      {console.log("hoverzim", disciplinaSelecionada)}
      {modalAberto && (
        <ModalSubjects
          disciplina={disciplinaSelecionada}
          onCloseModal={onCloseModal}
        />
      )}
      <div className="bg-red-500 mt-80 z-90">
        <button className="border" onClick={setShowFilterCompleted}>
          concluido
        </button>
        {showSubjectCompleted && (
          <div className="bg-yellow-300 flex flex-col gap-1 overflow-auto p-2">
            {subjectCompleted.map((item) => (
              <div key={item.codigo} className="text-sm border-b">
                {item.codigo} - {item.nome}
              </div>
            ))}
          </div>
        )}
        <div className="bg-green-500 z-90">
          <button className="border" onClick={setShowFilterPendant}>
            pendant
          </button>
          {showSubjectPendant && (
            <div>
              {pendent.map((item) => (
                <div>
                  <span>
                    {item.codigo} -- {item.nome}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
