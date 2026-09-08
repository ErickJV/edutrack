import uuid
import re

from django.db import migrations

NAMESPACE = uuid.UUID("14d16756-76d5-4bc1-9657-04bd2597c44a")


def slugify_simple(text: str) -> str:
    cleaned = re.sub(r"[^\w\s-]", "", text.lower())
    return re.sub(r"[-\s]+", "-", cleaned).strip("-")


# Estrutura: (course_slug, [(semester, [(name, code, workload_hours, description), ...]), ...])
CURRICULA = [
    (
        "analise-e-desenvolvimento-de-sistemas",
        [
            (
                1,
                [
                    ("Lógica de Programação e Algoritmos", "ADS101", 80, "Fundamentos de lógica, estruturas de controle e algoritmos."),
                    ("Engenharia de Software e Métodos Ágeis", "ADS102", 80, "Ciclo de vida do software, Scrum, Kanban e requisitos."),
                    ("Arquitetura de Computadores e SO", "ADS103", 40, "Hardware, sistemas operacionais, memória e concorrência."),
                    ("Fundamentos de Banco de Dados", "ADS104", 40, "Modelagem relacional, normalização e comandos SQL básicos."),
                ],
            ),
            (
                2,
                [
                    ("Estrutura de Dados", "ADS201", 80, "Listas, pilhas, filas, árvores e complexidade algorítmica."),
                    ("Programação Orientada a Objetos com Java", "ADS202", 80, "Classes, herança, polimorfismo, encapsulamento e interfaces."),
                    ("Banco de Dados SQL e NoSQL", "ADS203", 80, "Modelagem avançada, triggers, procedures e bancos NoSQL."),
                    ("Desenvolvimento Web Front-End", "ADS204", 40, "HTML5, CSS3, JavaScript moderno e conceitos de SPA."),
                ],
            ),
            (
                3,
                [
                    ("Desenvolvimento Web Back-End e APIs", "ADS301", 80, "Arquitetura RESTful, autenticação JWT, ORM e microsserviços."),
                    ("Padrões de Projeto e Clean Code", "ADS302", 80, "Design patterns GoF, SOLID, refatoração e boas práticas."),
                    ("DevOps e Integração Contínua", "ADS303", 40, "Docker, CI/CD pipelines, automação e infraestrutura ágil."),
                    ("Design de Interface e Experiência do Usuário (UI/UX)", "ADS304", 40, "Figma, prototipação, usabilidade e acessibilidade digital."),
                ],
            ),
            (
                4,
                [
                    ("Desenvolvimento de Aplicações Mobile", "ADS401", 80, "Frameworks multiplataforma, consumo de APIs e publicação."),
                    ("Computação em Nuvem e Arquiteturas Escaláveis", "ADS402", 80, "Serviços AWS/Azure, escalabilidade e serverless."),
                    ("Testes Automatizados e Qualidade de Software", "ADS403", 40, "TDD, testes unitários, testes de integração e E2E."),
                    ("Inteligência Artificial Aplicada", "ADS404", 40, "Conceitos de ML, processamento de linguagem e visão computacional."),
                ],
            ),
            (
                5,
                [
                    ("Projeto Integrador de Sistemas", "ADS501", 80, "Desenvolvimento e entrega de solução ponta a ponta com cliente real."),
                    ("Segurança em Aplicações e Governança", "ADS502", 80, "OWASP Top 10, LGPD, criptografia e conformidade."),
                    ("Tópicos Avançados em Tecnologia da Informação", "ADS503", 40, "Tendências emergentes e arquiteturas modernas de mercado."),
                ],
            ),
        ],
    ),
    (
        "ciencia-da-computacao",
        [
            (
                1,
                [
                    ("Algoritmos e Estruturas de Dados I", "CC101", 80, "Construção de algoritmos e técnicas de programação imperativa."),
                    ("Cálculo Diferencial e Integral I", "CC102", 80, "Limites, derivadas, taxas de variação e introdução à integração."),
                    ("Álgebra Linear e Geometria Analítica", "CC103", 80, "Vetores, matrizes, transformações lineares e espaços vetoriais."),
                    ("Introdução à Ciência da Computação", "CC104", 40, "História, fundamentos teóricos e áreas de atuação."),
                ],
            ),
            (
                2,
                [
                    ("Algoritmos e Estruturas de Dados II", "CC201", 80, "Árvores binárias, balanceadas, grafos e algoritmos de busca."),
                    ("Cálculo Diferencial e Integral II", "CC202", 80, "Integrais múltiplas, séries numéricas e equações diferenciais."),
                    ("Circuitos Digitais e Organização de Computadores", "CC203", 80, "Portas lógicas, microcontroladores e arquitetura de CPU."),
                    ("Probabilidade e Estatística para Computação", "CC204", 80, "Variáveis aleatórias, distribuições e inferência estatística."),
                ],
            ),
            (
                3,
                [
                    ("Teoria da Computação e Linguagens Formais", "CC301", 80, "Autômatos finitos, gramáticas livres de contexto e Máquinas de Turing."),
                    ("Paradigmas de Linguagens de Programação", "CC302", 80, "Programação funcional, lógica e orientada a objetos."),
                    ("Sistemas de Banco de Dados", "CC303", 80, "Álgebra relacional, indexação B-Tree e controle de concorrência."),
                    ("Redes de Computadores", "CC304", 80, "Modelo OSI, TCP/IP, roteamento e segurança de redes."),
                ],
            ),
            (
                4,
                [
                    ("Sistemas Operacionais e Concorrência", "CC401", 80, "Gerência de processos, threads, semáforos e memória virtual."),
                    ("Inteligência Artificial e Aprendizado de Máquina", "CC402", 80, "Redes neurais, aprendizado supervisionado e não supervisionado."),
                    ("Construção de Compiladores", "CC403", 80, "Análise léxica, sintática, semântica e geração de código."),
                    ("Computação Gráfica e Processamento de Imagens", "CC404", 80, "Transformações 2D/3D, renderização e filtros digitais."),
                ],
            ),
        ],
    ),
    (
        "banco-de-dados",
        [
            (
                1,
                [
                    ("Modelagem de Dados Conceitual e Lógica", "BD101", 80, "Entidade-relacionamento, normalização e regras de negócio."),
                    ("Lógica de Programação e Scripts", "BD102", 80, "Algoritmos, estruturas condicionais e scripts de automação."),
                    ("Arquitetura e Administração de SGBDs", "BD103", 80, "Instalação, configuração de instâncias e storage engine."),
                ],
            ),
            (
                2,
                [
                    ("Linguagem SQL Avançada e Otimização", "BD201", 80, "Procedures, triggers, CTEs, planos de execução e tunning."),
                    ("Bancos de Dados NoSQL e Big Data", "BD202", 80, "Document, key-value, column-family e graph databases."),
                    ("Business Intelligence e Data Warehousing", "BD203", 80, "ETL, modelagem dimensional e pipelines analíticos."),
                ],
            ),
        ],
    ),
    (
        "defesa-cibernetica",
        [
            (
                1,
                [
                    ("Fundamentos de Segurança da Informação", "DC101", 80, "Tríade CIA, políticas de segurança e análise de vulnerabilidade."),
                    ("Redes Seguras e Protocolos Criptográficos", "DC102", 80, "Firewalls, IDS/IPS, VPNs e chaves criptográficas."),
                    ("Sistemas Operacionais e Hardening", "DC103", 80, "Configuração segura de Linux e Windows Server."),
                ],
            ),
            (
                2,
                [
                    ("Pentest e Testes de Intrusão", "DC201", 80, "Metodologias de teste ético, reconhecimento e exploração."),
                    ("Perícia Forense Digital e Resposta a Incidentes", "DC202", 80, "Coleta de evidências, cadeia de custódia e relatórios periciais."),
                    ("Governança, Riscos e Conformidade (GRC)", "DC203", 80, "ISO 27001, LGPD e frameworks de cibersegurança."),
                ],
            ),
        ],
    ),
    (
        "engenharia-da-computacao",
        [
            (
                1,
                [
                    ("Algoritmos e Programação para Engenharia", "EC101", 80, "Lógica e resolução de problemas em linguagem C/C++."),
                    ("Física Geral: Mecânica e Termodinâmica", "EC102", 80, "Leis de Newton, energia e princípios de física aplicada."),
                    ("Cálculo Diferencial e Vetorial", "EC103", 80, "Funções de múltiplas variáveis e vetores em engenharia."),
                ],
            ),
            (
                2,
                [
                    ("Eletricidade e Circuitos Elétricos", "EC201", 80, "Leis de Kirchhoff, circuitos AC/DC e análise nodal."),
                    ("Eletrônica Analógica e Digital", "EC202", 80, "Diodos, transistores, amplificadores e lógica sequencial."),
                    ("Sistemas Microprocessados e Embarcados", "EC203", 80, "Arquitetura ARM, microcontroladores e periféricos."),
                ],
            ),
        ],
    ),
    (
        "gestao-da-tecnologia-da-informacao",
        [
            (
                1,
                [
                    ("Fundamentos da Gestão de TI", "GTI101", 80, "Estratégia de negócios e alinhamento de TI."),
                    ("Gestão de Projetos e Metodologias Ágeis", "GTI102", 80, "PMBOK, Scrum, Kanban e liderança de equipes."),
                    ("Infraestrutura de TI e Serviços em Nuvem", "GTI103", 80, "Redes corporativas, virtualização e fornecedores Cloud."),
                ],
            ),
            (
                2,
                [
                    ("Governança e Melhores Práticas (ITIL / COBIT)", "GTI201", 80, "Gerenciamento de serviços e governança corporativa."),
                    ("Gestão de Custos e Finanças em TI", "GTI202", 80, "Orçamento, ROI de tecnologia e análise de viabilidade."),
                    ("Segurança e Gestão de Continuidade de Negócios", "GTI203", 80, "Planos de recuperação de desastres e conformidade."),
                ],
            ),
        ],
    ),
    (
        "redes-de-computadores",
        [
            (
                1,
                [
                    ("Arquitetura de Redes e Protocolos", "RC101", 80, "Fundamentos de redes locais, IPv4/IPv6 e roteamento básico."),
                    ("Administração de Sistemas Abertos Linux", "RC102", 80, "Serviços DNS, DHCP, Web e shell scripting."),
                    ("Cabeamento Estruturado e Redes Sem Fio", "RC103", 80, "Normas EIA/TIA, Wi-Fi 6 e planejamento de cobertura."),
                ],
            ),
            (
                2,
                [
                    ("Roteamento e Comutação Avançados", "RC201", 80, "VLANs, OSPF, BGP e switches gerenciáveis."),
                    ("Segurança Perimetral e Firewalls", "RC202", 80, "IPTables, pfSense, DMZ e políticas de acesso."),
                    ("Redes Definidas por Software (SDN) e Automação", "RC203", 80, "Ansible, telemetria e gerência programável."),
                ],
            ),
        ],
    ),
    (
        "sistemas-de-informacao",
        [
            (
                1,
                [
                    ("Introdução aos Sistemas de Informação", "SI101", 80, "Papel da informação nas organizações e tomada de decisão."),
                    ("Lógica de Programação e Algoritmos", "SI102", 80, "Desenvolvimento de rotinas computacionais."),
                    ("Modelagem de Processos de Negócio (BPMN)", "SI103", 80, "Mapeamento, análise e redesenho de processos organizacionais."),
                ],
            ),
            (
                2,
                [
                    ("Banco de Dados para Sistemas Corporativos", "SI201", 80, "Projetos de bancos relacionais integrados."),
                    ("Desenvolvimento de Aplicações Corporativas", "SI202", 80, "Programação orientada a componentes e APIs de integração."),
                    ("Sistemas Integrados de Gestão (ERP/CRM)", "SI203", 80, "Arquitetura e parametrização de plataformas empresariais."),
                ],
            ),
        ],
    ),
]


def seed_curriculum(apps, schema_editor):
    Course = apps.get_model("catalog", "Course")
    Subject = apps.get_model("academic", "Subject")

    for course_slug, semesters in CURRICULA:
        try:
            course = Course.objects.get(slug=course_slug)
        except Course.DoesNotExist:
            continue

        for semester, subjects in semesters:
            for name, code, workload_hours, description in subjects:
                subject_slug = slugify_simple(name)
                subject_id = uuid.uuid5(NAMESPACE, f"subject:{course_slug}:{semester}:{subject_slug}")
                Subject.objects.update_or_create(
                    id=subject_id,
                    defaults={
                        "course": course,
                        "name": name,
                        "code": code,
                        "semester": semester,
                        "workload_hours": workload_hours,
                        "description": description,
                        "active": True,
                    },
                )


def unseed_curriculum(apps, schema_editor):
    Subject = apps.get_model("academic", "Subject")
    Subject.objects.all().delete()


class Migration(migrations.Migration):
    dependencies = [
        ("catalog", "0002_seed_courses"),
        ("academic", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_curriculum, reverse_code=unseed_curriculum),
    ]
