const { con } = require("../../config/dbConfig");

const identifyController = async (req, res) => {
  const { email, phoneNumber } = req.body;

  try {
      let contacts = await findContacts(email, phoneNumber);
      
      console.log(contacts);

    if (contacts.length === 0) {
      const newContact = await createPrimaryContact(email, phoneNumber);
      return res.json(formatResponse(newContact));
    }

    let primaryContact = contacts.find(
      (contact) => contact.linkPrecedence === "primary"
    );
    let secondaryContacts = contacts.filter(
      (contact) => contact.linkPrecedence === "secondary"
    );

    if (!primaryContact) {
      // Promote the first secondary contact to primary if no primary exists
      primaryContact = secondaryContacts[0];
      primaryContact.linkPrecedence = "primary";
      await updateContactToPrimary(primaryContact.id);
      secondaryContacts = secondaryContacts.slice(1);
    }

    // Check if new secondary contact needs to be created
    const existingContact = contacts.find(
      (contact) =>
        (contact.email === email && contact.phoneNumber === phoneNumber) ||
        (contact.email === email && contact.phoneNumber !== phoneNumber) ||
        (contact.email !== email && contact.phoneNumber === phoneNumber)
    );

    if (!existingContact) {
      const newSecondaryContact = await createSecondaryContact(
        primaryContact.id,
        email,
        phoneNumber
      );
      secondaryContacts.push(newSecondaryContact);
    }
      
      console.log(secondaryContacts);

    const response = formatResponse(primaryContact, secondaryContacts);
   return res.json(response);
  } catch (error) {
    res.status(500).send(error.toString());
  }
};

const findContacts = (email, phoneNumber) => {
    console.log(email,phoneNumber);
  return new Promise((resolve, reject) => {
    const query = `
      SELECT * FROM contacts
      WHERE (email = ? OR phoneNumber = ?)
      AND deletedAt IS NULL
    `;
    con.query(query, [email, phoneNumber], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

const createPrimaryContact = (email, phoneNumber) => {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO contacts (email, phoneNumber, linkPrecedence)
      VALUES (?, ?, 'primary')
    `;
    con.query(query, [email, phoneNumber], (err, result) => {
      if (err) return reject(err);
      resolve({
        id: result.insertId,
        email,
        phoneNumber,
        linkPrecedence: "primary",
      });
    });
  });
};

const createSecondaryContact = (linkedId, email, phoneNumber) => {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO contacts (email, phoneNumber, linkedId, linkPrecedence)
      VALUES (?, ?, ?, 'secondary')
    `;
    con.query(query, [email, phoneNumber, linkedId], (err, result) => {
      if (err) return reject(err);
      resolve({
        id: result.insertId,
        email,
        phoneNumber,
        linkedId,
        linkPrecedence: "secondary",
      });
    });
  });
};

const updateContactToPrimary = (id) => {
  return new Promise((resolve, reject) => {
    const query = `
      UPDATE contacts
      SET linkPrecedence = 'primary'
      WHERE id = ?
    `;
    con.query(query, [id], (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

const formatResponse = (primaryContact, secondaryContacts = []) => {
  const emails = [
    primaryContact.email,
    ...secondaryContacts.map((contact) => contact.email),
  ].filter(Boolean);
  const phoneNumbers = [
    primaryContact.phoneNumber,
    ...secondaryContacts.map((contact) => contact.phoneNumber),
  ].filter(Boolean);
  const secondaryContactIds = secondaryContacts.map((contact) => contact.id);

  return {
    contact: {
      primaryContactId: primaryContact.id,
      emails,
      phoneNumbers: [...new Set(phoneNumbers)],
      secondaryContactIds,
    },
  };
};

module.exports = { identifyController };
