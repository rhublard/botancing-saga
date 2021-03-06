const BasicCommand = require('../BasicCommand');
const {
   formatStyleToEmbed,
   getStylesByCharacterName,
} = require('../../utilities/spreadsheet.styles');

module.exports = class StylesCommand extends BasicCommand {
   constructor(client) {
      super(client, {
         name: 'perso',
         aliases: ['personnage', 'char', 'character'],
         group: 'styles',
         memberName: 'perso',
         args: [
            {
               key: 'perso',
               prompt:
                  'Nom (complet ou partiel) du perso dont les styles sont voulus',
               type: 'string',
            },
         ],
         description:
            'Recherche les styles correspondant au nom du perso donné. Les données sont obtenues via https://docs.google.com/spreadsheets/d/1AUquzPB0vDKYxOHC1uU4G7CNrNSNwLr89MOTWjQBNu0/edit?fbclid=IwAR3_z1fChnhTWIkVIQ5r3Dy9VneQqSq_mk_s3vSNXmiTy6WjyN0SOQEqOwY#gid=892217297',
      });
   }
   run(message, { perso }) {
      const authId = message.author.id;
      message.author = null;

      if (!perso || perso.length < 0) {
         message.reply(
            'Réesayez en saisissant un nom de personnage partiel ou complet.'
         );
         return;
      }

      if (perso.length < 2) {
         message.reply('Réessayez en saissant 2 caractères ou plus.');
         return;
      }

      getStylesByCharacterName(perso, async (styles, error) => {
         if (error) {
            message.reply(
               "La récupération des données n'a pas été possible. Il est probable que le fonctionnement du bot soit incorrect. Réessayez ultérieurement."
            );
         }
         switch (styles.length) {
            case 0:
               message.reply('Aucun résultat trouvé.');
               break;
            case 1:
               message.reply(formatStyleToEmbed(styles[0]));
               break;
            default:
               message.reply(
                  'Plusieurs styles trouvés, saisir le chiffre associé avec le style pour continuer:\n' +
                     styles
                        .map((st, id) => `[${id}] - ${st.name} "${st.style}"`)
                        .join('\n')
               );
               message.channel
                  .awaitMessages((m) => m.author.id === authId, {
                     max: 1,
                     time: 30000,
                     errors: ['time'],
                  })
                  .then((result) => {
                     const index = result && parseInt(result.first(1));
                     if (!isNaN(index) && index < styles.length) {
                        message.reply(formatStyleToEmbed(styles[index]));
                     } else {
                        message.reply('Saisie invalide.');
                     }
                  })
                  .catch(() => {
                     message.reply("La requête n'a pas pu être complétée.");
                  });
               break;
         }
      }).then(([promise, outdated, inError]) => {
         if (outdated) {
            message.reply(
               "Les données en caches ne sont pas à jour. Il va être mis à jour. L'opération risque de prendre plus de temps que d'habitude."
            );
         }

         if (inError) {
            message.reply(
               "Une erreur est survenue lors de l'accès au cache. Il va être mis à jour. L'opération risque de prendre plus de temps que d'habitude."
            );
         }
      });
   }
};
