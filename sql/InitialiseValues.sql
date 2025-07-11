-- PUT Sample Insert Statements Here for values



INSERT INTO Conversations (User1ID, User2ID)
VALUES
(1, 2),  -- Alice & Bob
(1, 3);  -- Alice & Carol

INSERT INTO Messages (ConversationID, SenderID, Content)
VALUES
(1, 1, 'Hey Bob, how are you?'),          -- Alice to Bob
(1, 2, 'Hi Alice! I am good, thanks!'),   -- Bob replies
(2, 3, 'Hey Alice, ready for the meeting?'), -- Carol to Alice
(2, 1, 'Yes, Carol! Starting soon.');     -- Alice replies
