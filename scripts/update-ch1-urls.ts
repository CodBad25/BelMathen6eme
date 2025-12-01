import { updateResource } from "../server/db";

const updates = [
  {
    id: "ch1-feuille-route",
    url: "https://files.manuscdn.com/user_upload_by_module/session_file/109950314/qBTtOhicGzHYkqDr.pdf",
  },
  {
    id: "ch1-cours",
    url: "https://files.manuscdn.com/user_upload_by_module/session_file/109950314/bqnEVrihbOTrCjiv.pdf",
  },
  {
    id: "ch1-fiche-1",
    url: "https://files.manuscdn.com/user_upload_by_module/session_file/109950314/MJgIuokzXUalrjlO.pdf",
  },
  {
    id: "ch1-fiche-2",
    url: "https://files.manuscdn.com/user_upload_by_module/session_file/109950314/DhaSrAvCaJUZcDYq.pdf",
  },
  {
    id: "ch1-fiche-3",
    url: "https://files.manuscdn.com/user_upload_by_module/session_file/109950314/VcnDjGhrxzPXbTYa.pdf",
  },
  {
    id: "ch1-aide-1",
    url: "https://files.manuscdn.com/user_upload_by_module/session_file/109950314/GujHZjuzIRnLoGYJ.pdf",
  },
  {
    id: "ch1-aide-2",
    url: "https://files.manuscdn.com/user_upload_by_module/session_file/109950314/jfxbFhckxaTBJFUD.pdf",
  },
  {
    id: "ch1-exercices",
    url: "https://files.manuscdn.com/user_upload_by_module/session_file/109950314/cXqsaxYYEhpJDwQf.pdf",
  },
  {
    id: "ch1-sit-1",
    url: "https://files.manuscdn.com/user_upload_by_module/session_file/109950314/tLKMsGzWsgRjvebE.pdf",
  },
  {
    id: "ch1-sit-2",
    url: "https://files.manuscdn.com/user_upload_by_module/session_file/109950314/DWFVYXdoUfRdVira.pdf",
  },
  {
    id: "ch1-sit-3",
    url: "https://files.manuscdn.com/user_upload_by_module/session_file/109950314/cNqpuwlWrjulqlZd.pdf",
  },
  {
    id: "ch1-sit-4",
    url: "https://files.manuscdn.com/user_upload_by_module/session_file/109950314/EOuJIVdvBkyhptre.pdf",
  },
  {
    id: "ch1-sit-5",
    url: "https://files.manuscdn.com/user_upload_by_module/session_file/109950314/drEdCLoGHWQPDUMZ.pdf",
  },
  {
    id: "ch1-sit-6",
    url: "https://files.manuscdn.com/user_upload_by_module/session_file/109950314/KlsZvvSHHmmQfXNV.pdf",
  },
  {
    id: "ch1-sit-7",
    url: "https://files.manuscdn.com/user_upload_by_module/session_file/109950314/ZpSCjMmUNQduidBA.pdf",
  },
];

console.log(`Mise à jour de ${updates.length} liens...`);

for (const update of updates) {
  await updateResource({ id: update.id, url: update.url });
  console.log(`✓ ${update.id}`);
}

console.log("✅ Tous les liens ont été mis à jour !");
process.exit(0);

